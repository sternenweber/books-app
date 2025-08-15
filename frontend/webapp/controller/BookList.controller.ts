import Controller from "sap/ui/core/mvc/Controller";
import ObjectStatus from "sap/m/ObjectStatus";
import JSONModel from "sap/ui/model/json/JSONModel";
import Dialog from "sap/m/Dialog";
import Table from "sap/m/Table";
import MessageToast from "sap/m/MessageToast";
import DatePicker from "sap/m/DatePicker";

declare global { interface Window { __API_BASE_URL?: string; } }

export default class BookList extends Controller {
  private _debounce?: number;

  onInit(): void {
    void this.checkHealth();
    void this.loadBooks(); 
    this.getView()?.setModel(new JSONModel({}), "edit");
    this.getView()?.setModel(new JSONModel({}), "create");
  }

  private get baseUrl(): string {
    return window.__API_BASE_URL || "http://localhost:8000";
  }

  private getSearchText(): string {
    return (this.byId("search") as any)?.getValue?.() || "";
  }

  private getDateRange(): { from?: string; to?: string } {
    const dpFrom = this.byId("dpFrom") as DatePicker;
    const dpTo = this.byId("dpTo") as DatePicker;
    const from = dpFrom?.getValue() || undefined;
    const to = dpTo?.getValue() || undefined;
    return { from, to };
  }

  private async checkHealth(): Promise<void> {
    const statusCtrl = this.byId("healthStatus") as ObjectStatus;
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      statusCtrl.setText(`Backend: ${data.status ?? "ok"}`);
      statusCtrl.setState("Success");
    } catch {
      statusCtrl.setText("Backend: unreachable");
      statusCtrl.setState("Error");
    }
  }

   private async loadBooks(q?: string, createdFrom?: string, createdTo?: string): Promise<void> {
    const url = new URL(`${this.baseUrl}/api/books`);
    if (q && q.trim()) url.searchParams.set("q", q.trim());
    if (createdFrom) url.searchParams.set("created_from", createdFrom); 
    if (createdTo) url.searchParams.set("created_to", createdTo);      

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const items = data.map((b: any) => ({
      ...b,
      created_at: b.created_at ? new Date(b.created_at) : null
    }));

    const model = new JSONModel({ books: items });
    model.setSizeLimit(1000);
    this.getView()?.setModel(model);
  }

  onSearch(e: any): void {
    const q = e.getParameter("query") ?? this.getSearchText();
    const { from, to } = this.getDateRange();
    void this.loadBooks(q, from, to);
  }

  onLiveChange(e: any): void {
    const q = e.getParameter("newValue") ?? "";
    const { from, to } = this.getDateRange();
    if (this._debounce) { window.clearTimeout(this._debounce); }
    this._debounce = window.setTimeout(() => { void this.loadBooks(q, from, to); }, 300);
  }

  onDateChanged(): void {
    const q = this.getSearchText();
    const { from, to } = this.getDateRange();
    void this.loadBooks(q, from, to);
  }

  onClearFilters(): void {
    const dpFrom = this.byId("dpFrom") as DatePicker;
    const dpTo = this.byId("dpTo") as DatePicker;
    dpFrom?.setValue("");
    dpTo?.setValue("");
    void this.loadBooks(this.getSearchText(), undefined, undefined);
  }

   onEdit(): void {
    const table = this.byId("booksTable") as Table;
    const item = table.getSelectedItem();
    if (!item) {
      MessageToast.show("Please select a row to edit.");
      return;
    }
    const ctx = item.getBindingContext();
    const data = ctx?.getObject() as any;
    const clone = { id: data.id, title: data.title, author: data.author, created_by: data.created_by };
    (this.getView()?.getModel("edit") as JSONModel).setData(clone);

    (this.byId("editDialog") as Dialog).open();
  }

  async onSaveEdit(): Promise<void> {
    const editModel = this.getView()?.getModel("edit") as JSONModel;
    const payload = editModel.getData() as { id: number; title: string; author: string; created_by: string };

    try {
      const res = await fetch(`${this.baseUrl}/api/books/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          author: payload.author,
          created_by: payload.created_by
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      (this.byId("editDialog") as Dialog).close();

      await this.loadBooks((this.byId("search") as any)?.getValue?.());

      MessageToast.show("Book updated.");
    } catch (e) {
      console.error(e);
      MessageToast.show("Failed to update book.");
    }
  }

  onCancelEdit(): void {
    (this.byId("editDialog") as Dialog).close();
  }

  onAdd(): void {
    const createModel = this.getView()?.getModel("create") as JSONModel;
    createModel.setData({ title: "", author: "", created_by: "system" });
    (this.byId("createDialog") as Dialog).open();
  }

  async onSaveCreate(): Promise<void> {
    const createModel = this.getView()?.getModel("create") as JSONModel;
    const payload = createModel.getData() as { title: string; author: string; created_by?: string };

    if (!payload.title?.trim() || !payload.author?.trim()) {
      MessageToast.show("Bitte Titel und Autor ausfüllen.");
      return;
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title.trim(),
          author: payload.author.trim(),
          created_by: payload.created_by?.trim() || "system"
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      (this.byId("createDialog") as Dialog).close();

      const q = (this.byId("search") as any)?.getValue?.();
      await this.loadBooks(q);

      MessageToast.show("Buch angelegt.");
    } catch (e) {
      console.error(e);
      MessageToast.show("Buch konnte nicht angelegt werden.");
    }
  }

  onCancelCreate(): void {
    (this.byId("createDialog") as Dialog).close();
  }
}
