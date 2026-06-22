import { useState, useEffect, useRef, useCallback } from "react";
import { apiUrl } from "../api";
import { useNavigate } from "react-router-dom";
import { t } from "../locale";

import { AgGridReact } from "@ag-grid-community/react";
import { ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function LogBrowser() {
	const nav = useNavigate();
	const [rowData, setRowData] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const gridRef = useRef<AgGridReact>(null);
	const savedSize = parseInt(localStorage.getItem("browse_page_size") || "20") || 20;

	useEffect(() => {
		fetch(apiUrl("/admin/browse?_ajax=1&page=1&size=2000&sort[0][field]=time&sort[0][dir]=desc"))
			.then((r) => r.json())
			.then((data) => { setRowData(data.data || []); setLoading(false); })
			.catch(() => setLoading(false));
	}, []);

	const colDefs: any[] = [
		{ field: "time", headerName: t("browse.col_time"), width: 140, sortable: true, cellRenderer: (p: any) => p.value ? new Date(p.value).toLocaleString() : "" },
		{ field: "mod_id", headerName: t("browse.col_mod"), width: 90, sortable: true },
		{ field: "mod_ver", headerName: t("browse.col_version"), width: 80, sortable: true },
		{ field: "game_ver", headerName: t("browse.col_game"), width: 80, sortable: true },
		{ field: "error", headerName: t("browse.col_error"), flex: 3, minWidth: 80 },
		{ field: "stack", headerName: t("browse.col_stack"), flex: 3, minWidth: 80 },
		{ field: "state", headerName: t("browse.col_state"), flex: 2, minWidth: 60 },
		{ field: "os", headerName: t("browse.col_os"), width: 80, sortable: true },
		{ field: "os_ver", headerName: t("browse.col_os_ver"), width: 80, sortable: true },
		{ field: "count", headerName: t("browse.col_count"), width: 60, sortable: true },
		{ field: "hash", headerName: t("browse.col_hash"), width: 70 },
	];

	const onRowClicked = useCallback((event: any) => {
		if (event.data?.id) nav("/admin/logs?hash=" + encodeURIComponent(event.data.id));
	}, [nav]);

	const onPaginationChanged = useCallback(() => {
		const api = gridRef.current?.api;
		if (api) localStorage.setItem("browse_page_size", String(api.paginationGetPageSize()));
	}, []);

	if (loading) return <p style={{ color: "#94a3b8", padding: "2rem" }}>Loading...</p>;

	return (
		<div className="ag-theme-quartz-dark" style={{ height: "calc(100vh - 120px)", width: "100%" }}>
			<AgGridReact
				ref={gridRef}
				rowData={rowData}
				columnDefs={colDefs}
				defaultColDef={{ resizable: true }}
				pagination={true}
				paginationPageSize={savedSize}
				paginationPageSizeSelector={[10, 20, 50]}
				onRowClicked={onRowClicked}
				onPaginationChanged={onPaginationChanged}
			/>
		</div>
	);
}
