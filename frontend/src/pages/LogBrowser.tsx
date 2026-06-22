import { useState, useEffect, useRef, useCallback } from "react";
import { apiUrl } from "../api";
import { useNavigate } from "react-router-dom";

import { AgGridReact } from "@ag-grid-community/react";
import { ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const gridStyle = {
	"--ag-background-color": "#1e293b",
	"--ag-odd-row-background-color": "#1a2235",
	"--ag-header-background-color": "#0f172a",
	"--ag-border-color": "#334155",
	"--ag-row-hover-color": "#334155",
	"--ag-font-size": "12px",
	"--ag-header-font-size": "11px",
} as React.CSSProperties;

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
		{ field: "time", headerName: "Time", width: 140, sortable: true, cellRenderer: (p: any) => p.value ? new Date(p.value).toLocaleString() : "" },
		{ field: "mod_id", headerName: "Mod", width: 90, sortable: true },
		{ field: "mod_ver", headerName: "Version", width: 80, sortable: true },
		{ field: "game_ver", headerName: "Game", width: 80, sortable: true },
		{ field: "error", headerName: "Error", flex: 3, minWidth: 80 },
		{ field: "stack", headerName: "Stack", flex: 3, minWidth: 80 },
		{ field: "state", headerName: "State", flex: 2, minWidth: 60 },
		{ field: "os", headerName: "OS", width: 80, sortable: true },
		{ field: "os_ver", headerName: "OS Ver", width: 80, sortable: true },
		{ field: "count", headerName: "Count", width: 60, sortable: true },
		{ field: "hash", headerName: "Hash", width: 70 },
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
		<div className="ag-theme-quartz" style={{ ...gridStyle, height: "calc(100vh - 120px)", width: "100%" }}>
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
