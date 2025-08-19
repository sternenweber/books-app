import Controller from "sap/ui/core/mvc/Controller";
import ObjectStatus from "sap/m/ObjectStatus";
import JSONModel from "sap/ui/model/json/JSONModel";
import Dialog from "sap/m/Dialog";
import Table from "sap/m/Table";
import MessageToast from "sap/m/MessageToast";
import DatePicker from "sap/m/DatePicker";
import Select from "sap/m/Select";
import MessageBox from "sap/m/MessageBox";

declare global { interface Window { __API_BASE_URL?: string; } }

export default class BookList extends Controller {
  private _debounce?: number;
  private _page = 1;
  private _pageSizeKey: "10" | "25" | "50" | "alle" = "10";
  private _pageSize = 10;
  private _total = 0;

  private _showTrash = false;

  onInit(): void {
    void this.checkHealth();

    this.getView()?.addEventDelegate({
      onAfterRendering: () => {
        const sel = this.byId("pageSize") as Select;
        sel?.setSelectedKey(this._pageSizeKey);
      }
    });

    this.getView()?.setModel(new JSONModel({}), "edit");
    this.getView()?.setModel(new JSONModel({}), "create");

    void this.refresh();
  }

  private _recomputePageSize(): void {
    if (this._pageSizeKey === "alle") {
      this._pageSize = Math.max(1, this._total);
      this._page = 1;
    } else {
      this._pageSize = parseInt(this._pageSizeKey, 10);
    }
  }

  private async fetchTotal(q?: string, from?: string, to?: string): Promise<number> {
    const base = this.baseUrl.replace(/\/+$/, "");
    const path = this._showTrash ? "/api/books/trash/count" : "/api/books/count";
    const url = new URL(path, base);
    if (q && q.trim()) url.searchParams.set("q", q.trim());
    if (from) url.searchParams.set("created_from", from);
    if (to) url.searchParams.set("created_to", to);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { total } = await res.json();
    return total ?? 0;
  }

  private async loadBooksPage(q?: string, from?: string, to?: string): Promise<void> {
    const base = this.baseUrl.replace(/\/+$/, "");
    const url = new URL(this._showTrash ? "/api/books/trash" : "/api/books", base);
    if (q && q.trim()) url.searchParams.set("q", q.trim());
    if (from) url.searchParams.set("created_from", from);
    if (to) url.searchParams.set("created_to", to);

    const limitForRequest = this._pageSizeKey === "alle" ? this._total || 1 : this._pageSize;
    const offsetForRequest = this._pageSizeKey === "alle" ? 0 : (this._page - 1) * this._pageSize;

    url.searchParams.set("limit", String(limitForRequest));
    url.searchParams.set("offset", String(offsetForRequest));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const items = data.map((b: any) => ({
      ...b,
      created_at: b.created_at ? new Date(b.created_at) : null
    }));

    const model = new JSONModel({ books: items });
    model.setSizeLimit(100000);
    this.getView()?.setModel(model);
  }

  private updatePagerUI(): void {
    const start = this._total === 0 ? 0 : ((this._page - 1) * this._pageSize) + 1;
    const end = this._pageSizeKey === "alle"
      ? this._total
      : Math.min(this._page * this._pageSize, this._total);

    (this.byId("pageInfo") as any)?.setText?.(
      `${this._showTrash ? "Korb" : "Bücher"} ${start}–${end} von ${this._total}`
    );

    (this.byId("btnPrev") as any)?.setEnabled?.(this._page > 1 && this._pageSizeKey !== "alle");
    (this.byId("btnNext") as any)?.setEnabled?.(
      end < this._total && this._pageSizeKey !== "alle"
    );
  }

  private async refresh(): Promise<void> {
    const q = this.getSearchText();
    const { from, to } = this.getDateRange();

    this._total = await this.fetchTotal(q, from, to);
    this._recomputePageSize();

    const totalPages =
      this._pageSizeKey === "alle" ? 1 : Math.max(1, Math.ceil(this._total / this._pageSize));
    if (this._page > totalPages) this._page = totalPages;

    await this.loadBooksPage(q, from, to);
    this.updatePagerUI();
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

    const fromVal = dpFrom?.getValue();
    const toVal = dpTo?.getValue();

    const from = fromVal && fromVal.trim() !== "" ? fromVal : undefined;
    const to = toVal && toVal.trim() !== "" ? toVal : undefined;

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
  onSearch(): void {
    this._page = 1;
    void this.refresh();
  }

  onLiveChange(): void {
    if (this._debounce) window.clearTimeout(this._debounce);
    this._debounce = window.setTimeout(() => {
      this._page = 1;
      void this.refresh();
    }, 300);
  }

  onDateChanged(): void {
    this._page = 1;
    void this.refresh();
  }

  onClearFilters(): void {
    (this.byId("dpFrom") as DatePicker)?.setValue("");
    (this.byId("dpTo") as DatePicker)?.setValue("");
    this._page = 1;
    void this.refresh();
  }

  onPageSizeChange(e: any): void {
    const key = e.getSource().getSelectedKey?.() as "10" | "25" | "50" | "alle";
    this._pageSizeKey = key || "10";
    this._page = 1;
    void this.refresh();
  }

  onPrevPage(): void {
    if (this._pageSizeKey === "alle") return;
    if (this._page > 1) {
      this._page -= 1;
      void this.refresh();
    }
  }

  onNextPage(): void {
    if (this._pageSizeKey === "alle") return;
    const totalPages = Math.max(1, Math.ceil(this._total / this._pageSize));
    if (this._page < totalPages) {
      this._page += 1;
      void this.refresh();
    }
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
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      (this.byId("editDialog") as Dialog).close();
      await this.refresh();
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
      this._page = 1;
      await this.refresh();
      MessageToast.show("Buch angelegt.");
    } catch (e) {
      console.error(e);
      MessageToast.show("Buch konnte nicht angelegt werden.");
    }
  }

  onCancelCreate(): void {
    (this.byId("createDialog") as Dialog).close();
  }

  async onDelete(): Promise<void> {
    const table = this.byId("booksTable") as Table;
    const item = table.getSelectedItem();
    if (!item) {
      MessageToast.show("Bitte wählen Sie ein Buch zum Löschen.");
      return;
    }
    const ctx = item.getBindingContext();
    const data = ctx?.getObject() as any;

    MessageBox.confirm(`"${data.title}" löschen und in den Korb verschieben?`, {
      actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
      onClose: async (action: typeof MessageBox.Action[keyof typeof MessageBox.Action]) => {
        if (action === MessageBox.Action.OK) {
          try {
            const res = await fetch(`${this.baseUrl}/api/books/${data.id}`, {
            method: "DELETE"
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          await this.refresh();
          MessageToast.show("Buch in den Korb verschoben.");
        } catch (e) {
            console.error(e);
            MessageToast.show("Löschen fehlgeschlagen.");
          }
        }
      }
    });
  }

  private async loadDeletedBooks(): Promise<void> {
    const base = this.baseUrl.replace(/\/+$/, "");
    const url = new URL("/api/books/trash", base);

    const limitForRequest = this._pageSizeKey === "alle" ? this._total || 1 : this._pageSize;
    const offsetForRequest = this._pageSizeKey === "alle" ? 0 : (this._page - 1) * this._pageSize;
    url.searchParams.set("limit", String(limitForRequest));
    url.searchParams.set("offset", String(offsetForRequest));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const items = data.map((b: any) => ({
      ...b,
      deleted_at: b.deleted_at ? new Date(b.deleted_at) : null
    }));

    const model = new JSONModel({ books: items });
    model.setSizeLimit(100000);
    this.getView()?.setModel(model, "trash");
    
    (this.byId("trashTable") as Table)?.removeSelections?.();
    this._setTrashActionsEnabled(false);
  }

  onShowTrash(): void {
    void this.loadDeletedBooks();
    (this.byId("trashDialog") as Dialog).open();
  }

  onTabChange(e: any): void {
  const key = e.getParameter("key"); 
  this._showTrash = key === "trash";

  if (this._showTrash) {
    void this.loadDeletedBooks();
    this._setTrashActionsEnabled(false);
  } else {
    this._page = 1;
    void this.refresh();
  }
  this.updatePagerUI();
}

  async onRestore(): Promise<void> {
    const table = this.byId("trashTable") as Table;
    const item = table.getSelectedItem();
    if (!item) {
      MessageToast.show("Bitte wählen Sie ein Buch zum Wiederherstellen.");
      return;
    }
    const data = item.getBindingContext("trash")?.getObject() as any;
    const res = await fetch(`${this.baseUrl}/api/books/${data.id}/restore`, { method: "PUT" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    MessageToast.show("Buch wiederhergestellt.");
  
    await this.refresh();
    await this.loadDeletedBooks();
    (this.byId("trashTable") as Table)?.removeSelections?.();
    this._setTrashActionsEnabled(false);
  }

  async onHardDelete(): Promise<void> {
    const table = this.byId("trashTable") as Table;
    const item = table.getSelectedItem();
    if (!item) {
      MessageToast.show("Bitte wählen Sie ein Buch zum endgültigen Löschen.");
      return;
    }
    const data = item.getBindingContext("trash")?.getObject() as any;

    MessageBox.confirm(`"${data.title}" endgültig löschen?`, {
      actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
      onClose: async (action: any) => {
        if (action === MessageBox.Action.OK) {
          try {
            const res = await fetch(`${this.baseUrl}/api/books/${data.id}/hard_delete`, {
              method: "DELETE"
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            MessageToast.show("Buch endgültig gelöscht.");
            await this.refresh();          
            await this.loadDeletedBooks();
            (this.byId("trashTable") as Table)?.removeSelections?.();
            this._setTrashActionsEnabled(false);
          } catch (e) {
            console.error(e);
            MessageToast.show("Endgültiges Löschen fehlgeschlagen.");
          }
        }
      }
    });
  }
  private _setTrashActionsEnabled(enabled: boolean): void {
    (this.byId("btnRestore") as any)?.setEnabled(enabled);
    (this.byId("btnHardDelete") as any)?.setEnabled(enabled);
  }

  onTrashSelectionChange(): void {
    const table = this.byId("trashTable") as Table;
    const hasSelection = !!table.getSelectedItem();
    this._setTrashActionsEnabled(hasSelection);
  }

  onToggleTrash(): void {
    this._showTrash = !this._showTrash;
    this._page = 1;
    void this.refresh();
    MessageToast.show(this._showTrash ? "Korb geöffnet." : "Bücherübersicht geöffnet.");
  }
}
