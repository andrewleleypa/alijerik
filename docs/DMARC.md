# Correo — SPF, DKIM y DMARC de `alijerik.com`

> **Estado verificado el 17-sep-2026** contra DNS en vivo (resolutor `1.1.1.1`) y contra
> dos reportes agregados reales (Microsoft y Google). Este documento dice **qué hay hoy**,
> **cómo se comprueba** y **qué falta**. La decisión de *no* endurecer el raíz todavía vive
> en [ADR 0005](adr/0005-dmarc-raiz-en-none-hasta-censo-de-remitentes.md); el trabajo
> pendiente, en [`BACKLOG.md` §6](BACKLOG.md).

---

## 1. El mapa: dos dominios con dos posturas distintas

`alijerik.com` no es un solo dominio de correo. Son dos superficies con configuración
independiente, y confundirlas es la causa de casi todo el enredo de esta sesión.

| | `alijerik.com` (raíz) | `mfa.alijerik.com` |
|---|---|---|
| Qué manda | correo humano: `contacto@`, comercial | MFA y notificaciones de CompaCorp y Eficore |
| Por dónde | **PrivateEmail** (Namecheap) | **Resend** (Amazon SES por debajo) |
| SPF | ✅ `v=spf1 include:spf.privateemail.com ~all` | ✅ pero en `send.mfa.alijerik.com` (ver §3) |
| DKIM | ✅ `default._domainkey` | ✅ `resend._domainkey` |
| DMARC | ⚠️ **`p=none`** — solo observa | ✅ **`p=quarantine`** |
| Recibe correo | ✅ `mx1/mx2.privateemail.com` | ❌ sin MX, sin A — solo envía |
| Veredicto | 🟡 hueco latente, ver §4 | ✅ cerrado, no tocar |

**Los reportes de los dos llegan a `contacto@alijerik.com`**, porque ese buzón está en el
`rua=` de ambos registros DMARC. No es una suscripción a nada ni un correo sospechoso: es
lo que uno mismo pidió al publicar el registro.

---

## 2. Registros en vivo — copia literal (17-sep-2026)

```
_dmarc.alijerik.com                    TXT   v=DMARC1; p=none; rua=mailto:contacto@alijerik.com
alijerik.com                           TXT   v=spf1 include:spf.privateemail.com ~all
alijerik.com                           TXT   google-site-verification=Hbgf58nJu_Lks1UbatxLFfBKXlswj3YiJhxdsen6S74
alijerik.com                           MX    10 mx1.privateemail.com
alijerik.com                           MX    10 mx2.privateemail.com
default._domainkey.alijerik.com        TXT   v=DKIM1;k=rsa;p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...

_dmarc.mfa.alijerik.com                TXT   v=DMARC1; p=quarantine; rua=mailto:contacto@alijerik.com
resend._domainkey.mfa.alijerik.com     TXT   p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDONEAF+XueKHMhXuwRjqAB...
send.mfa.alijerik.com                  TXT   v=spf1 include:amazonses.com ~all
send.mfa.alijerik.com                  MX    feedback-smtp.us-east-1.amazonses.com
mfa.alijerik.com                       --    sin A, sin MX, sin TXT (y está bien, ver §3)
```

Dos detalles que parecen errores y no lo son:

- **El DKIM de Resend arranca en `p=` sin `v=DKIM1;k=rsa;`.** Es válido: `v` y `k` son
  opcionales y tienen valor por defecto. No le falta nada.
- **`mfa.alijerik.com` no tiene SPF propio y no lo necesita**, porque el sobre no sale con
  ese dominio. Sale con `send.mfa.alijerik.com`. Ver §3.

---

## 3. `mfa.alijerik.com` — por qué pasa, con el mecanismo completo

Resend no manda con el subdominio directo: usa un **sub-subdominio de rebote**. El correo
lleva dos identidades distintas, y DMARC las evalúa por separado:

| Identidad | Valor real | Quién la revisa |
|---|---|---|
| `header_from` (lo que ve el humano) | `mfa.alijerik.com` | DMARC, para decidir qué política aplicar |
| `envelope_from` / `mfrom` (el sobre) | `send.mfa.alijerik.com` | SPF |
| Firma DKIM | `d=mfa.alijerik.com`, selector `resend` | DKIM |

DMARC exige que pase SPF **o** DKIM, y que además **alinee** con el `header_from`. Aquí
alinean los dos:

- **DKIM alinea exacto**: firma con `d=mfa.alijerik.com`, igual al `header_from`.
- **SPF alinea en modo relajado**: el registro publica `aspf=r`, y `send.mfa.alijerik.com`
  comparte dominio organizacional (`alijerik.com`) con `mfa.alijerik.com`. En modo
  estricto (`aspf=s`) **esto fallaría** — no cambiar esa bandera sin entender esta línea.

### Lo que dijeron los dos reportes

| | Microsoft (`Enterprise Outlook`) | Google |
|---|---|---|
| ID | `65a1090ad2e84d55ac4559c38e6b7be5` | `1461676286438076329` |
| Ventana UTC | 15-sep 00:00 → 16-sep 00:00 | 16-sep 00:00 → 16-sep 23:59 |
| Mensajes | **7** (desde 5 IPs de SES) | **3** (desde 3 IPs de SES) |
| DKIM evaluado | `pass` (100 %) | `pass` (100 %) |
| SPF evaluado | `pass` (100 %) | `pass` (100 %) |
| `disposition` | **`none`** — no se cuarentenó nada | **`none`** |
| `envelope_to` | `segurosfortis.com` | (Google no lo reporta) |

IPs vistas, todas de Amazon SES us-east-1: `54.240.9.38`, `54.240.9.42`, `54.240.9.67`,
`54.240.14.41`, `54.240.14.43`, `54.240.14.58`, `54.240.14.59`.

**Esos 10 mensajes son tráfico propio del go-live de CompaCorp** (producción desde el
15-sep, 5 usuarios creados ese día — los MFA salieron hacia buzones de `segurosfortis.com`).
No hay ni un solo registro de un tercero.

⚠️ **Lo que estos reportes NO prueban:** son dos receptores en dos días parcialmente
solapados. Dicen que *lo que llegó a Microsoft y a Google* pasó — no son un censo de todo
lo que sale. Para eso hacen falta semanas de reportes, que es justo el argumento del §4.

---

## 4. `alijerik.com` (raíz) — el hueco real

**`p=none` significa que DMARC no hace nada.** Observa y reporta; no pide que se rechace ni
se cuarentene nada. Hoy cualquiera puede mandar correo diciendo ser `@alijerik.com` y
entra al buzón del destinatario con la misma cara que uno legítimo.

La parte buena: **el raíz ya tiene con qué defenderse** — SPF de PrivateEmail y DKIM en
`default._domainkey` ya publicados y funcionando. No falta infraestructura; falta dar la
orden. Subirlo a `quarantine` es editar **un** registro en Cloudflare.

🔴 **Y por eso mismo es peligroso hacerlo hoy.** El raíz es el dominio del correo humano y
comercial: `contacto@`, cotizaciones, lo que salga de Railway, formularios, avisos de
Eficore. Si alguno de esos remitentes no está cubierto por el SPF o el DKIM del raíz,
ponerlo en `quarantine` lo manda a spam **sin error visible**: no se ve un fallo, se ven
correos que nunca llegaron. Es la clase de rotura que se descubre semanas después, por un
cliente que dice "yo nunca recibí eso".

**La secuencia correcta está en el [ADR 0005](adr/0005-dmarc-raiz-en-none-hasta-censo-de-remitentes.md)**:
censo de remitentes primero, endurecer después. `p=none` ya está juntando los datos que
hacen falta — el reloj corre solo.

### Endurecimientos menores, evaluados y NO aplicados

| Idea | Veredicto |
|---|---|
| `v=spf1 -all` en `mfa.alijerik.com` | Cerraría el sobre directo del subdominio. **Valor bajo**: DMARC ya cubre la suplantación del `header_from`, que es la que importa. Si se pone, verificar antes que Resend siga usando `send.*` como sobre. |
| Subir el raíz de `~all` a `-all` | **No ahora.** Con DMARC activo el softfail alcanza, y el hardfail rompe reenvíos (listas, alias) sin avisar. Se evalúa *después* del censo, no antes. |
| `sp=` explícito en el raíz | Innecesario hoy: el único subdominio que envía (`mfa`) tiene su propio registro, que manda sobre cualquier `sp`. |

---

## 5. Cómo se comprueba — comandos que funcionan

### Leer los registros

```powershell
# DMARC de los dos dominios
foreach ($d in @("_dmarc.alijerik.com","_dmarc.mfa.alijerik.com")) {
  "=== $d ==="
  Resolve-DnsName -Name $d -Type TXT -Server 1.1.1.1 | ForEach-Object { $_.Strings -join "" }
}

# SPF y DKIM (OJO con -Type TXT, ver §6)
foreach ($n in @("alijerik.com","default._domainkey.alijerik.com",
                 "send.mfa.alijerik.com","resend._domainkey.mfa.alijerik.com")) {
  "=== $n ==="
  Resolve-DnsName -Name $n -Type TXT -Server 1.1.1.1 | ForEach-Object { $_.Strings -join "" }
}
```

### Abrir un reporte agregado

Llegan a `contacto@alijerik.com` como adjunto comprimido. Microsoft manda `.xml.gz`,
Google manda `.zip`. El nombre del archivo lleva `!` (bash no lo expande si se entrecomilla).

```bash
# Microsoft, .xml.gz
gunzip -c "/c/Users/andre/Downloads/enterprise.protection.outlook.com!mfa.alijerik.com!<ini>!<fin>.xml.gz"
```

```powershell
# Google, .zip
Expand-Archive -LiteralPath "C:\Users\andre\Downloads\google.com!mfa.alijerik.com!<ini>!<fin>.zip" -DestinationPath "$env:TEMP\dmarc" -Force
Get-ChildItem -LiteralPath "$env:TEMP\dmarc" | ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw }
```

### Qué leer del XML, en orden

1. **`<policy_evaluated>`** — el veredicto. `dkim`/`spf` en `pass` y `disposition` en
   `none` = el correo pasó limpio. Esto es lo único que dice si algo está roto.
2. **`<identifiers>`** — `header_from` vs `envelope_from`. Si no coinciden, ahí está la
   historia de la alineación (§3).
3. **`<auth_results>`** — el detalle técnico: qué selector firmó, qué dominio autorizó.
4. **`<source_ip>` + `<count>`** — quién mandó y cuántos. **Una IP que no reconoces con
   `spf=fail` y `dkim=fail` es el único patrón que significa suplantación.**

---

## 6. 🔴 Caminos falsos — los cuatro errores que costó esta sesión

**Se escriben porque los cuatro son trampas que se vuelven a pisar**, y tres de ellos
produjeron un diagnóstico falso con toda la confianza del mundo.

### 1. `Resolve-DnsName` sin `-Type TXT` miente en silencio

El `-Type` por defecto es `A_AAAA`. Un barrido de **28 selectores DKIM** corrido así
devolvió "no existe DKIM en ninguna parte" — cuando el registro está publicado y
funcionando. No preguntó mal por poco: preguntó por **direcciones IP** de un nombre que
solo tiene texto. Cero coincidencias, cero errores, conclusión invertida.

> **Un DKIM se comprueba siempre con `-Type TXT`.** Y un barrido que devuelve *cero* en
> todo debe hacer sospechar de la consulta antes que del DNS.

### 2. "SPF no se hereda del padre" es cierto, y aun así llevó a la conclusión opuesta

La regla es correcta: el SPF de `alijerik.com` **no** aplica a `mfa.alijerik.com`; son
consultas DNS distintas y DMARC no hace fallback al dominio organizacional para SPF.
De ahí se saltó a *"entonces no hay alineación posible y los MFA caen en spam"* — falso,
porque la alineación tenía **dos** caminos abiertos (§3) y ninguno pasaba por el SPF del
padre. Saber una regla no es saber cuál manda.

### 3. Un reporte DMARC entrante no acusa a nadie

Que Google y Microsoft manden reportes de un subdominio **no** es señal de suplantación.
Un receptor genera reporte por **todo** el tráfico que ve con ese `header_from`, propio o
ajeno. Aquí eran los 10 mensajes del go-live de CompaCorp. **El reporte no es la
conclusión: es el insumo.** Hay que abrirlo antes de opinar.

### 4. `sp=` y `np=` aparecen en el reporte y no están en el registro

Los reportes publican `<sp>quarantine</sp>` y `<np>quarantine</np>` para
`mfa.alijerik.com`, pero el TXT real solo dice `p=quarantine; rua=...`. No falta nada: los
receptores reportan el valor **efectivo** (`sp` hereda de `p` cuando no se declara). No
salir a buscar en Cloudflare un registro que nunca se escribió.

---

## 7. ⏰ Cuando el raíz pase a `quarantine`: el agregador va ANTES

Hoy son 10 mensajes al día y abrir el `.zip` a mano es viable. El raíz mueve el correo
humano y comercial: van a llegar XML diarios de Google, Microsoft, Yahoo, Comcast y otros
cinco, todos a `contacto@alijerik.com`. **Leerlos a mano no aguanta, y un reporte que no
se lee es un registro DMARC decorativo.**

La forma barata: un agregador gratis (**Postmark DMARC Digests** manda resumen semanal
legible) puesto en el `rua=` **junto** con el buzón propio — el `rua` acepta varias
direcciones separadas por coma. Eso se configura *antes* de endurecer, para que el censo
del §4 se lea en una tabla y no en XML crudo.
