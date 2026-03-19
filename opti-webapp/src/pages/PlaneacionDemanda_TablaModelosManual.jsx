/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { getColorForString } from "./PlaneacionDemanda_clasificacion";

// -----------------------------
// Estilos (mismo look que TablaClasificacionDemanda)
// -----------------------------
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  "&.MuiTableCell-head": {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
    fontWeight: 600,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
    transition: "background-color 0.2s ease",
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

// -----------------------------
// Helpers UI (mismo estilo base)
// -----------------------------
const CategoryCell = ({ category }) => {
  const categoryColors = {
    Suave: "#1976d2",
    Intermitente: "#2e7d32",
    "Lumpy/Irregular": "#d32f2f",
    "Lumpy / Irregular": "#d32f2f",
    Errática: "#ed6c02",
    Erratica: "#ed6c02",
  };
  const color = categoryColors[category] || "#757575";

  return (
    <Chip
      label={category || "Sin categoría"}
      size="small"
      sx={{ bgcolor: color, color: "white", fontWeight: 500 }}
    />
  );
};

const ChannelCell = ({ canal }) => {
  if (!canal) {
    return (
      <Chip
        label="Sin canal"
        size="small"
        sx={{ bgcolor: "#757575", color: "white", fontWeight: 500 }}
      />
    );
  }
  const color = getColorForString(canal);
  return (
    <Chip
      label={canal}
      size="small"
      sx={{ bgcolor: color, color: "white", fontWeight: 500 }}
    />
  );
};

const _formatNum4 = (v) => {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  return n.toFixed(4);
};

// -----------------------------
// Sort helpers (mismo patrón)
// -----------------------------
const descendingComparator = (a, b, orderBy) => {
  const av = a?.[orderBy];
  const bv = b?.[orderBy];

  // números
  if (typeof av === "number" && typeof bv === "number") {
    if (bv < av) return -1;
    if (bv > av) return 1;
    return 0;
  }

  // strings (fallback)
  const as = av?.toString?.() ?? "";
  const bs = bv?.toString?.() ?? "";
  return bs.localeCompare(as);
};

const getComparator = (order, orderBy) => {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
};

// stable sort
const stableSort = (array, comparator) => {
  const stabilized = array.map((el, index) => [el, index]);
  stabilized.sort((a, b) => {
    const cmp = comparator(a[0], b[0]);
    if (cmp !== 0) return cmp;
    return a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
};

// -----------------------------
// Componente principal
// -----------------------------
/**
 * data: [{Producto,Canal,Ubicacion,ADI,CV2,Categoria/Category,Modelo/selected_model,available_models?}]
 * allowedModels: fallback array (si no viene available_models por fila)
 * onModelChange: async ({Producto,Canal,Ubicacion, ...row}, newModelLower) => void
 */
const TablaPlaneacionDemanda_ModelosManual = ({
  data,
  allowedModels = ["prophet", "croston", "tsb", "arima"],
  onModelChange,
  rowsPerPageOptions = [15, 25, 50],
  maxHeight = 500,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions?.[0] ?? 15);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("Producto");
  const [tableData, setTableData] = useState(Array.isArray(data) ? data : []);

  // sincronizar cuando cambia data desde el parent
  useEffect(() => {
    setTableData(Array.isArray(data) ? data : []);
    setPage(0);
  }, [data]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (_event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleRows = useMemo(() => {
    const sorted = stableSort(tableData, getComparator(order, orderBy));
    return sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [tableData, order, orderBy, page, rowsPerPage]);

  if (!tableData || tableData.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          No hay DFUs para mostrar.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <TableContainer component={Paper} sx={{ maxHeight }}>
        <Table stickyHeader aria-label="tabla modelos manual">
          <TableHead>
            <TableRow>
              <StyledTableCell>
                <TableSortLabel
                  active={orderBy === "Producto"}
                  direction={orderBy === "Producto" ? order : "asc"}
                  onClick={() => handleRequestSort("Producto")}
                >
                  Producto
                </TableSortLabel>
              </StyledTableCell>

              <StyledTableCell>
                <TableSortLabel
                  active={orderBy === "Canal"}
                  direction={orderBy === "Canal" ? order : "asc"}
                  onClick={() => handleRequestSort("Canal")}
                >
                  Canal
                </TableSortLabel>
              </StyledTableCell>

              <StyledTableCell>
                <TableSortLabel
                  active={orderBy === "Ubicacion"}
                  direction={orderBy === "Ubicacion" ? order : "asc"}
                  onClick={() => handleRequestSort("Ubicacion")}
                >
                  Ubicación
                </TableSortLabel>
              </StyledTableCell>

              <StyledTableCell align="right">
                <TableSortLabel
                  active={orderBy === "ADI"}
                  direction={orderBy === "ADI" ? order : "asc"}
                  onClick={() => handleRequestSort("ADI")}
                >
                  ADI
                </TableSortLabel>
              </StyledTableCell>

              <StyledTableCell align="right">
                <TableSortLabel
                  active={orderBy === "CV2"}
                  direction={orderBy === "CV2" ? order : "asc"}
                  onClick={() => handleRequestSort("CV2")}
                >
                  CV²
                </TableSortLabel>
              </StyledTableCell>

              <StyledTableCell>
                <TableSortLabel
                  active={orderBy === "Categoria"}
                  direction={orderBy === "Categoria" ? order : "asc"}
                  onClick={() => handleRequestSort("Categoria")}
                >
                  Categoría
                </TableSortLabel>
              </StyledTableCell>

              <StyledTableCell>
                <TableSortLabel
                  active={orderBy === "Modelo"}
                  direction={orderBy === "Modelo" ? order : "asc"}
                  onClick={() => handleRequestSort("Modelo")}
                >
                  Modelo
                </TableSortLabel>
              </StyledTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleRows.map((row, idx) => {
              const categoria = row.Categoria ?? row.Category ?? null;
              const modelsForRow =
                Array.isArray(row.available_models) && row.available_models.length
                  ? row.available_models
                  : allowedModels;

              const currentModelRaw =
                row.Modelo ??
                row.selected_model ??
                (Array.isArray(row.recommended_models) ? row.recommended_models[0] : "");

              const currentModel = (currentModelRaw || "").toString().trim().toLowerCase();

              return (
                <StyledTableRow key={`${row.Producto}-${row.Canal}-${row.Ubicacion}-${idx}`}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                    {row.Producto}
                  </TableCell>

                  <TableCell>
                    <ChannelCell canal={row.Canal} />
                  </TableCell>

                  <TableCell>{row.Ubicacion}</TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      bgcolor: Number(row.ADI) > 3 ? "rgba(255, 152, 0, 0.15)" : "inherit",
                    }}
                  >
                    {_formatNum4(row.ADI)}
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      bgcolor: Number(row.CV2) > 0.5 ? "rgba(244, 67, 54, 0.15)" : "inherit",
                    }}
                  >
                    {_formatNum4(row.CV2)}
                  </TableCell>

                  <TableCell>
                    <CategoryCell category={categoria} />
                  </TableCell>

                  <TableCell>
                    <select
                      value={currentModel}
                      onChange={async (e) => {
                        const newModel = String(e.target.value || "").trim().toLowerCase();

                        // update optimista en UI
                        setTableData((prev) =>
                          prev.map((x) =>
                            x.Producto === row.Producto &&
                            x.Canal === row.Canal &&
                            x.Ubicacion === row.Ubicacion
                              ? { ...x, Modelo: newModel, selected_model: newModel }
                              : x
                          )
                        );

                        // callback al parent para persistir en backend
                        if (onModelChange) {
                          try {
                            await onModelChange(row, newModel);
                          } catch (err) {
                            // rollback si falla
                            setTableData((prev) =>
                              prev.map((x) =>
                                x.Producto === row.Producto &&
                                x.Canal === row.Canal &&
                                x.Ubicacion === row.Ubicacion
                                  ? {
                                      ...x,
                                      Modelo: currentModel,
                                      selected_model: row.selected_model ?? null,
                                    }
                                  : x
                              )
                            );
                            console.error("[TablaModelosManual] error guardando modelo:", err);
                          }
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #cfcfcf",
                        background: "white",
                        fontWeight: 600,
                        color: "#012652",
                        cursor: "pointer",
                      }}
                    >
                      {modelsForRow.map((m) => {
                        const key = String(m).toLowerCase();
                        return (
                          <option key={key} value={key}>
                            {key.toUpperCase()}
                          </option>
                        );
                      })}
                    </select>
                  </TableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={tableData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </Box>
  );
};

export default TablaPlaneacionDemanda_ModelosManual;
