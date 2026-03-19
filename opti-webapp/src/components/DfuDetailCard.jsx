/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  Stack,
  TextField,
  Button,
  Divider,
  CircularProgress,
} from "@mui/material";

/**
 * DfuDetailCard
 * - Tabs: Gráfica / Comentarios
 * - On-demand: GET /planner/:sessionId/dfu/detail
 * - Cache + AbortController
 *
 * Props:
 * - sessionId: string
 * - selectedDFU: { Producto, Canal, Ubicacion } | null
 * - allDates: string[] (YYYY-MM-DD) de la tabla visible
 * - plannerApi: axios instance (con headers tenant) o helper para fetch
 * - GraphComponent: React component para renderizar la gráfica (recibe props { series, dfu, loading })
 */
export default function DfuDetailCard({
  sessionId,
  selectedDFU,
  allDates,
  plannerApi,
  GraphComponent,
}) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");

  // Cache en memoria por DFU+range
  const cacheRef = useRef(new Map());
  const abortRef = useRef(null);

  const range = useMemo(() => {
    if (!allDates || allDates.length === 0) return null;
    const fromDate = allDates[0];
    const last = allDates[allDates.length - 1];

    // toDate exclusivo (día siguiente) para que incluya el último día
    const d = new Date(last + "T00:00:00.000Z");
    d.setUTCDate(d.getUTCDate() + 1);
    const toDate = d.toISOString().slice(0, 10);

    return { fromDate, toDate };
  }, [allDates]);

  const cacheKey = useMemo(() => {
    if (!selectedDFU || !range) return null;
    const { Producto, Canal, Ubicacion } = selectedDFU;
    return `${sessionId}|${Producto}|${Canal}|${Ubicacion}|${range.fromDate}|${range.toDate}`;
  }, [sessionId, selectedDFU, range]);

  async function fetchDetail({ force = false } = {}) {
    if (!selectedDFU || !range || !sessionId) return;

    const key = cacheKey;
    if (!force && key && cacheRef.current.has(key)) {
      setDetail(cacheRef.current.get(key));
      setError("");
      return;
    }

    // abort request anterior
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");

    try {
      const { Producto, Canal, Ubicacion } = selectedDFU;

      // Si plannerApi es axios
      const resp = await plannerApi.get(`/${sessionId}/dfu/detail`, {
        params: {
          Producto,
          Canal,
          Ubicacion,
          fromDate: range.fromDate,
          toDate: range.toDate,
          commentsLimit: 50,
        },
        signal: controller.signal,
      });

      const data = resp.data;
      if (!data?.ok)
        throw new Error(data?.error || "Error al cargar detalle DFU");

      setDetail(data);
      if (key) cacheRef.current.set(key, data);
    } catch (e) {
      if (e?.name === "CanceledError" || e?.name === "AbortError") return;
      setError(e?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setDetail(null);
    setError("");
    if (selectedDFU) fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  async function handleAddComment() {
    if (!selectedDFU || !commentText.trim()) return;
    try {
      const { Producto, Canal, Ubicacion } = selectedDFU;

      await plannerApi.post(`/${sessionId}/dfu/comments`, {
        Producto,
        Canal,
        Ubicacion,
        text: commentText.trim(),
      });

      setCommentText("");

      // refresca detalle (force) para traer comentarios nuevos
      await fetchDetail({ force: true });
    } catch (e) {
      setError(e?.message || "No se pudo guardar el comentario");
    }
  }

  const title = selectedDFU
    ? `${selectedDFU.Producto} · ${selectedDFU.Canal} · ${selectedDFU.Ubicacion}`
    : "Selecciona un DFU en la tabla";

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6">{title}</Typography>

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Gráfica" />
            <Tab label="Comentarios" />
          </Tabs>

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          {loading && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={18} />
              <Typography variant="body2">Cargando detalle…</Typography>
            </Stack>
          )}

          {/* TAB: GRÁFICA */}
          {tab === 0 && (
            <Box sx={{ pt: 1 }}>
              {GraphComponent ? (
                <GraphComponent
                  dfu={selectedDFU}
                  series={detail?.series || null}
                  loading={loading}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Falta conectar el componente de gráfica.
                </Typography>
              )}
            </Box>
          )}

          {/* TAB: COMENTARIOS */}
          {tab === 1 && (
            <Box sx={{ pt: 1 }}>
              {!selectedDFU ? (
                <Typography variant="body2" color="text.secondary">
                  Selecciona un DFU para ver y agregar comentarios.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Nuevo comentario"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || loading}
                    >
                      Guardar
                    </Button>
                  </Stack>

                  <Divider />

                  <Stack spacing={1}>
                    {(detail?.comments || []).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No hay comentarios todavía.
                      </Typography>
                    ) : (
                      detail.comments.map((c) => (
                        <Box
                          key={String(c._id)}
                          sx={{
                            p: 1,
                            border: "1px solid #eee",
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {c.created_by || "usuario"} ·{" "}
                            {new Date(c.created_at).toLocaleString()} ·{" "}
                            {c.session_id}
                          </Typography>
                          <Typography variant="body2">{c.text}</Typography>
                        </Box>
                      ))
                    )}
                  </Stack>
                </Stack>
              )}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
