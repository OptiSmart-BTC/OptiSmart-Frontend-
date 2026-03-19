/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from "react";
import { Box, Stack, Typography, IconButton } from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import "../styles/components/PivotTable.css";

export default function PivotTable({
  allDates,
  pivotGroups,
  METRICS,
  prevYearLabel,
  anchorDate,
  loading,
  collapsedProducts,
  collapsedChannels,
  toggleProduct,
  toggleChannel,
  productTotals,
  channelTotals,
  computeGroupAsertividad,
  localPlans,
  setLocalPlans,
  handlePlanBlur,
  selectedDFU,
  onSelectDFU,
}) {
  return (
    <Box
      className="pivot-wrapper"
      sx={{
        width: "100%",
        maxWidth: "100%",
        maxHeight: 600,
        overflowX: "auto",
        overflowY: "auto",
      }}
    >
      <div className="pivot-inner">
        <table className="pivot-table">
          <thead>
            <tr>
              <th className="col-producto">Producto</th>
              <th className="col-canal">Canal</th>
              <th className="col-ubicacion">Ubicación</th>
              <th className="col-values">Values</th>
              {allDates.map((d) => {
                const [y, m, dd] = d.split("-");
                const label = `${dd}/${m}/${y}`;
                return (
                  <th key={d} className="col-fecha">
                    {label}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {pivotGroups.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={4 + allDates.length}
                  style={{ padding: "8px", textAlign: "center" }}
                >
                  No hay datos para la ventana y filtros seleccionados.
                </td>
              </tr>
            )}

            {pivotGroups.map((pg, idxProd) => {
              const productKey = pg.producto;
              const productCollapsed = collapsedProducts.has(productKey);

              const productRowSpan = productCollapsed
                ? METRICS.length
                : pg.canales.reduce((total, canal) => {
                    const channelKey = `${pg.producto}|${canal.canal}`;
                    const channelCollapsed = collapsedChannels.has(channelKey);
                    return (
                      total +
                      (channelCollapsed ? METRICS.length : canal.rowSpanCanal)
                    );
                  }, 0);

              return pg.canales.map((cg, idxCanal) =>
                cg.ubicaciones.map((ug, idxUbic) =>
                  METRICS.map((metric, idxMetric) => {
                    const isFirstRowProducto =
                      idxCanal === 0 && idxUbic === 0 && idxMetric === 0;
                    const isFirstRowCanal = idxUbic === 0 && idxMetric === 0;
                    const isFirstRowUbic = idxMetric === 0;

                    const channelKey = `${pg.producto}|${cg.canal}`;
                    const channelCollapsed = collapsedChannels.has(channelKey);

                    // Ocultar filas por colapso
                    if (productCollapsed && !(idxCanal === 0 && idxUbic === 0)) {
                      return null;
                    }
                    if (!productCollapsed && channelCollapsed && idxUbic !== 0) {
                      return null;
                    }

                    const isProductAgg = productCollapsed;
                    const isChannelAgg = !productCollapsed && channelCollapsed;
                    const isAggregated = isProductAgg || isChannelAgg;

                    const dfu = {
                      Producto: pg.producto,
                      Canal: cg.canal,
                      Ubicacion: ug.ubicacion,
                    };

                    const isSelected =
                      !!selectedDFU &&
                      selectedDFU.Producto === dfu.Producto &&
                      selectedDFU.Canal === dfu.Canal &&
                      selectedDFU.Ubicacion === dfu.Ubicacion;

                    return (
                      <tr
                        key={`${idxProd}-${idxCanal}-${idxUbic}-${metric.key}`}
                        className={isSelected && !isAggregated ? "pivot-row-selected" : ""}
                      >
                        {/* PRODUCTO */}
                        {isFirstRowProducto && (
                          <td
                            className="col-producto product-sticky-cell"
                            rowSpan={productRowSpan}
                          >
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProduct(pg.producto);
                                }}
                                sx={{
                                  color: "white",
                                  backgroundColor: "rgba(0,0,0,0.2)",
                                  "&:hover": {
                                    backgroundColor: "rgba(0,0,0,0.4)",
                                  },
                                }}
                              >
                                {productCollapsed ? (
                                  <KeyboardArrowRightIcon fontSize="inherit" />
                                ) : (
                                  <KeyboardArrowDownIcon fontSize="inherit" />
                                )}
                              </IconButton>
                              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                {pg.producto}
                              </Typography>
                            </Stack>
                          </td>
                        )}

                        {/* CANAL */}
                        {isFirstRowCanal && (
                          <>
                            {productCollapsed ? (
                              <td
                                rowSpan={METRICS.length}
                                className="col-canal pivot-row-header"
                              >
                                Total canales
                              </td>
                            ) : (
                              <td
                                rowSpan={channelCollapsed ? METRICS.length : cg.rowSpanCanal}
                                className="col-canal pivot-row-header"
                              >
                                <button
                                  type="button"
                                  className="pivot-toggle-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleChannel(pg.producto, cg.canal);
                                  }}
                                >
                                  {channelCollapsed ? "+" : "–"}
                                </button>{" "}
                                {cg.canal}
                              </td>
                            )}
                          </>
                        )}

                        {/* UBICACIÓN (click selecciona DFU) */}
                        {isFirstRowUbic && (
                          <>
                            {productCollapsed || channelCollapsed ? (
                              <td
                                rowSpan={METRICS.length}
                                className="col-ubicacion pivot-row-header"
                              >
                                Total ubicaciones
                              </td>
                            ) : (
                              <td
                                rowSpan={ug.rowSpanUbic}
                                className="col-ubicacion pivot-row-header pivot-dfu-click"
                                onClick={() => onSelectDFU?.(dfu)}
                                title="Click para ver detalle del DFU"
                                style={{ cursor: "pointer" }}
                              >
                                {ug.ubicacion}
                              </td>
                            )}
                          </>
                        )}

                        {/* VALUES */}
                        <td className="col-values">
                          {metric.key === "prev_year" ? prevYearLabel : metric.label}
                        </td>

                        {/* CELDAS FECHAS */}
                        {allDates.map((d) => {
                          const dateKey = d;
                          const isPast = anchorDate && dateKey < anchorDate;

                          const baseRow = !isAggregated ? ug.rowsByDate[dateKey] || null : null;

                          let rawValue = null;

                          if (isProductAgg) {
                            if (metric.key === "asertividad") {
                              const totalsByMetric = productTotals[pg.producto] || {};
                              const totalPlan = totalsByMetric["plan_fcst"]?.[dateKey] ?? null;
                              const totalActual = totalsByMetric["actual"]?.[dateKey] ?? null;
                              rawValue = computeGroupAsertividad(totalActual, totalPlan);
                            } else {
                              rawValue =
                                productTotals[pg.producto]?.[metric.key]?.[dateKey] ?? null;
                            }
                          } else if (isChannelAgg) {
                            const cKey = `${pg.producto}|${cg.canal}`;
                            if (metric.key === "asertividad") {
                              const totalsByMetric = channelTotals[cKey] || {};
                              const totalPlan = totalsByMetric["plan_fcst"]?.[dateKey] ?? null;
                              const totalActual = totalsByMetric["actual"]?.[dateKey] ?? null;
                              rawValue = computeGroupAsertividad(totalActual, totalPlan);
                            } else {
                              rawValue = channelTotals[cKey]?.[metric.key]?.[dateKey] ?? null;
                            }
                          } else {
                            rawValue = baseRow ? baseRow[metric.key] : null;
                          }

                          let cellKey = "";
                          if (!isAggregated && baseRow) {
                            cellKey = baseRow._id;
                          } else {
                            const aggTag = isProductAgg
                              ? `P|${pg.producto}`
                              : isChannelAgg
                              ? `C|${pg.producto}|${cg.canal}`
                              : `U|${pg.producto}|${cg.canal}|${ug.ubicacion}`;
                            cellKey = `${aggTag}|${metric.key}|${dateKey}`;
                          }

                          // PLAN editable solo en detalle y futuro
                          if (metric.key === "plan_fcst") {
                            const numeric =
                              rawValue != null && rawValue !== "" ? Number(rawValue) : null;

                            const formatted =
                              numeric != null && !Number.isNaN(numeric) ? numeric.toFixed(2) : "";

                            const locked = isAggregated || isPast || !baseRow;

                            if (locked) {
                              return (
                                <td
                                  key={cellKey}
                                  className="pivot-cell pivot-cell-readonly pivot-cell-locked"
                                >
                                  {formatted}
                                </td>
                              );
                            }

                            const value = localPlans[baseRow._id] ?? formatted;

                            return (
                              <td key={cellKey} className="pivot-cell pivot-cell-editable">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="pivot-input"
                                  value={value}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setLocalPlans((prev) => ({ ...prev, [baseRow._id]: v }));
                                  }}
                                  onBlur={(e) => handlePlanBlur(baseRow, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                            );
                          }

                          const display = (() => {
                            if (rawValue === null || rawValue === undefined) return "";

                            if (metric.key === "asertividad") {
                              const ratio = Number(rawValue);
                              if (!Number.isFinite(ratio)) return "";
                              const pct = ratio * 100;
                              return (
                                pct.toLocaleString("es-MX", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }) + "%"
                              );
                            }

                            return Number(rawValue).toLocaleString("es-MX", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            });
                          })();

                          const lockedClass = isPast || isAggregated ? " pivot-cell-locked" : "";

                          return (
                            <td
                              key={cellKey}
                              className={`pivot-cell pivot-cell-readonly ${
                                metric.key === "asertividad" ? "cell-asertividad" : ""
                              }${lockedClass}`}
                            >
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )
              );
            })}
          </tbody>
        </table>
      </div>
    </Box>
  );
}