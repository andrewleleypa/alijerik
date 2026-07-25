# Ensamble del video demo (`public/eficore-demo.mp4`)

> Pipeline reproducible. Última edición: 2026-07-25 — se insertó el acto
> **06 · CAMPAÑAS** (metraje de JC, `campañas.mp4`, 2110x1440@30, TEST/tenant acme)
> entre el acto 05 y la tarjeta PWA. Duración final: 67.1 s.

## Piezas

1. **Tarjetas/rótulos** — `node video-cards/render.mjs` (Chrome headless) genera
   `intro/outro/pwa.png` + `l1..l6.png` (los rótulos son PNG transparentes 1920x1200,
   pastilla abajo-izquierda).
2. **Base previa** — el demo ya editado (actos 01-05 + PWA + outro). El fundido a negro
   entre el acto 05 y la tarjeta PWA está en **t=40.70 s**: ese es el punto de inserción.

## Acto campañas — tratamiento

- `crop=2110:1352:0:0` — recorta la franja inferior (88 px): elimina el **tooltip del
  navegador con la URL de Railway** (no publicar el origen) y la pastilla "Espresso".
- `scale=1720:1102` + `pad=1920:1200` con fondo espresso `#17120D` (marco como los demás actos).
- Rótulo `l6.png` en overlay: entra 0.6 s (fade 0.35), sale 4.6-5.0 s.
- Fundido de entrada/salida a negro (0.35 s) para empatar con la gramática existente.
- El audio del metraje se descarta (el demo no lleva pista de audio).

## Comando

```
ffmpeg -y -i public/eficore-demo.mp4 -framerate 30 -loop 1 -t 19.4 -i video-cards/l6.png \
  -i campañas.mp4 -filter_complex "\
[0:v]trim=0:40.70,setpts=PTS-STARTPTS,setsar=1[v1];\
[2:v]crop=2110:1352:0:0,scale=1720:1102,pad=1920:1200:100:49:color=0x17120D,fps=30,setsar=1[c0];\
[1:v]format=rgba,fade=t=in:st=0.6:d=0.35:alpha=1,fade=t=out:st=4.6:d=0.4:alpha=1[lbl];\
[c0][lbl]overlay=0:0,fade=t=in:st=0:d=0.35,fade=t=out:st=19.05:d=0.35,format=yuv420p,setsar=1[v2];\
[0:v]trim=40.70,setpts=PTS-STARTPTS,setsar=1[v3];\
[v1][v2][v3]concat=n=3:v=1:a=0[v]" \
  -map "[v]" -c:v libx264 -crf 19 -preset medium -pix_fmt yuv420p -movflags +faststart salida.mp4
```

Nota: `setsar=1` en las tres ramas es obligatorio (el metraje de captura trae un SAR
raro y el concat lo rechaza). `lista2.txt` es de la edición original (segmentos temp,
ya no existen); esta receta es la vigente.
