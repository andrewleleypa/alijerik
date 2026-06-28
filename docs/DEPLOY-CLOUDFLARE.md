# Despliegue de Alijerik — Cloudflare (+ capa 1 de seguridad)

> Arquitectura y pasos para publicar `alijerik.com` en Cloudflare Pages y dejar
> montada la **capa 1 (borde)** de seguridad. Decidido 2026-06-28.
> Ver también la metodología `seguridad-por-capas` en la memoria global.

---

## Concepto clave (no confundir)

| Rol | Quién | Cambia? |
|-----|-------|---------|
| **Registrar** (dónde se compró el dominio) | **Namecheap** | NO. Se queda. Renueva 3-feb-2027. |
| **DNS host / nameservers** (quién responde el dominio) | **Cloudflare** | SÍ. Se mueven los NS a CF. |
| **Hosting de la web estática** | **Cloudflare Pages** | (Alijerik) |
| **Hosting de la app** | **Railway** | (Eficore — NO se mueve, se le pone CF delante) |

- **Pages = hospedar estático.** **Proxy (naranja) = poner CF delante de algo que ya vive en otro lado.**
- La web de Alijerik se hospeda en Pages. La app de Eficore se queda en Railway y se proxya por CF.
- Cuenta CF: la misma que ya se usa para R2 (`account_id cc39a72aba11ddf8c341266d279d5cd2`).

---

## Fase 0 — Verificar LOCAL (primero, antes de tocar DNS)

```bash
npm install
npm run build && npm run preview   # http://localhost:4173
# revisar: /  ·  /privacidad/  ·  /eliminacion-de-datos/  en desktop Y móvil
```
Ya verificado en build headless 2026-06-28: las 3 rutas dan 200 (con y sin slash),
/noexiste da 404, favicon 200.

---

## Fase 1 — Mover el DNS a Cloudflare (la llave de todo)

1. Cloudflare → **Add a site** → `alijerik.com` → plan **Free**.
2. CF escanea los records existentes. ⚠️ **VERIFICAR contra el panel "Advanced DNS" de Namecheap
   que importó TODO** (el auto-scan suele perder records). Records actuales conocidos (2026-06-28):
   - CNAME `eficore` → `mp441wir.up.railway.app` → **dejar en GRIS (DNS only)** = mantiene la app viva.
   - MX `@` → `mx1.privateemail.com` (pri 10) y `mx2.privateemail.com` (pri 10) = correo.
   - **+ SPF/DKIM/DMARC + autodiscover/SRV** de Namecheap Private Email → NO salieron en el `nslookup`;
     copiarlos EXACTOS desde Namecheap o los alias `contacto@`/`privacidad@` **dejan de recibir**.
   - Apex `alijerik.com`: hoy NO tiene A público real → se apuntará a Pages (Fase 2), nada que preservar.
   - NS actuales (Namecheap): `dns1.registrar-servers.com`, `dns2.registrar-servers.com`.
3. CF te da **2 nameservers**. En **Namecheap → Domain → Nameservers → Custom DNS** → pegar esos 2.
   (Único cambio en Namecheap. El dominio NO se transfiere; Namecheap sigue siendo el registrar.)
4. Esperar activación (minutos a pocas horas; CF avisa por correo). **Esto es la propagación.**
   Durante el solape, Namecheap y CF conviven → si ambos tienen el record de `eficore`, **cero downtime**.

> Mientras propaga, la app de Eficore sigue funcionando por el CNAME `eficore` (déjalo
> "DNS only" / gris al inicio; proxy naranja se activa en la Fase 4, con cuidado).

**Lado Railway (verificado 2026-06-28 con la pantalla Networking del servicio):** `eficore.alijerik.com`
es un **Custom Domain del servicio de Railway** (Port 8080 interno, check verde = verificado). El CNAME
que Railway pide es `eficore` → `mp441wir.up.railway.app`. **NO hay que tocar nada en Railway** en la
migración: con el CNAME idéntico y en gris en CF, Railway sigue viendo el mismo destino → check verde
intacto, cero downtime. No re-agregar ni borrar el domain en Railway.

---

## Fase 2 — Alijerik web en Cloudflare Pages

1. CF → **Workers & Pages → Create → Pages → Connect to Git** → repo `andrewleleypa/alijerik`.
   (Autorizar la GitHub App de Cloudflare en la cuenta personal + dar acceso al repo.)
2. Build config:
   - Framework preset: **Vite** (o None)
   - Build command: `npm run build`
   - Output directory: `dist`
3. Deploy → queda vivo en `alijerik.pages.dev` (sin DNS, para probar ya).
4. Pages → **Custom domains** → agregar `alijerik.com` y `www.alijerik.com`.
   Como el DNS ya está en CF, el **apex funciona nativo** (CNAME flattening) — sin el problema de Namecheap.

---

## Fase 3 — Meta (cuando la web esté viva en alijerik.com)

- Verificación de dominio de Meta: pegar el `<meta name="facebook-domain-verification">` en
  `index.html` (ya hay placeholder en el `<head>`), o un TXT en el DNS de CF.
- **Actualizar las URLs en la app de Meta** a `https://alijerik.com/privacidad` y
  `https://alijerik.com/eliminacion-de-datos`. Hacerlo ANTES de enviar el App Review.

---

## Fase 4 — Eficore detrás de CF (capa 1 de la APP — SEPARADO, antes de la clínica)

> NO se hace con prisa. Tiene trampas. Es defensa en profundidad antes de PII real (Ley 81).

1. En CF DNS: el record `eficore` → **Proxied (naranja)**. Origen sigue en Railway.
2. SSL/TLS → modo **Full (strict)** (Railway sirve cert válido).
3. Reglas WAF gratis (Security → WAF → Custom rules):
   - Rate-limit / protección en `/login` y `/otp`.
   - **Skip** para `URI Path = /webhook` → no bloquear los POST de Meta. El **HMAC del
     webhook sigue siendo el guardia real** (no depender de IPs de Meta, cambian).
4. Trampas a recordar:
   - CF **no** arregla bugs de app → el **test multitenant/IDOR sigue pendiente**.
   - Detrás de CF la IP real del cliente llega en `CF-Connecting-IP`, **no** al final de
     `X-Forwarded-For` → ajustar `_ip_real` en `eficore/app/web.py` o el rate-limit mide mal.

---

## Costo

Plan **Free** cubre lo de hoy: DDoS ilimitado, CDN, SSL, Pages, DNS, ~5 reglas WAF custom,
rate-limit básico. **Pro ($20/mes)** = WAF managed completo (OWASP) + más reglas + bot — solo
cuando haya clientes pagando. **Capa 1 hoy = $0.**
