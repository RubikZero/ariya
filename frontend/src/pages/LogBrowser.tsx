import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../locale";

import { AgGridReact } from "@ag-grid-community/react";
import { ModuleRegistry } from "@ag-grid-community/core";
import { InfiniteRowModelModule } from "@ag-grid-community/infinite-row-model";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([InfiniteRowModelModule]);

const token = () => {
	const t = localStorage.getItem("ariya_token") || sessionStorage.getItem("ariya_token") || "";
	const cookie = document.cookie.match(/(?:^|;\s*)ariya_token=([^;]*)/);
	return t || (cookie ? decodeURIComponent(cookie[1]) : "");
};

export default function LogBrowser() {
	const { t, lang } = useLocale();
	const nav = useNavigate();
	const savedSize = parseInt(localStorage.getItem("browse_page_size") || "20") || 20;

	const dataSource = {
		getRows: (params: any) => {
			const size = params.endRow - params.startRow;
			const page = Math.floor(params.startRow / size) + 1;
			let sortStr = "";
			if (params.sortModel?.length) {
				sortStr = "&sort[0][field]=" + encodeURIComponent(params.sortModel[0].colId) + "&sort[0][dir]=" + encodeURIComponent(params.sortModel[0].sort);
			}
			const url = "/admin/browse?_ajax=1&page=" + page + "&size=" + size + sortStr + "&token=" + encodeURIComponent(token());
			fetch(url)
				.then((r) => r.json())
				.then((data) => {
					params.successCallback(data.data || [], data.total || 0);
				})
				.catch(() => params.failCallback());
		},
	};

	const onGridReady = useCallback((event: any) => {
		event.api.setGridOption("datasource", dataSource);
	}, []);

	const onPaginationChanged = useCallback((event: any) => {
		try { localStorage.setItem("browse_page_size", String(event.api.paginationGetPageSize())); } catch {}
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

	return (
		<div className="ag-theme-quartz" style={{ height: "calc(100vh - 120px)", width: "100%" }}>
			<AgGridReact key={lang}
				columnDefs={colDefs}
				defaultColDef={{ resizable: true }}
				rowModelType="infinite"
				pagination={true}
				paginationPageSize={savedSize}
				paginationPageSizeSelector={[10, 20, 50]}
				cacheBlockSize={savedSize}
				maxBlocksInCache={1}
				onGridReady={onGridReady}
				onPaginationChanged={onPaginationChanged}
				onRowClicked={(event: any) => {
					if (event.data?.id) nav("/admin/logs?hash=" + encodeURIComponent(event.data.id));
				}}
			/>
		</div>
	);
}
