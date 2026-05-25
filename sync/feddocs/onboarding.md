# Onboarding — Ordamy Frontend

## ¿Qué es el Ordamy Frontend?

El Ordamy Frontend es una aplicación web SPA (Single Page Application) construida con Angular 21 que proporciona la interfaz de usuario para el sistema de gestión empresarial Ordamy. Es la capa de presentación que interactúa con el Ordamy Middleware mediante una API RESTful.

La aplicación implementa lazy loading de módulos, manejo de estado de sesión mediante servicios Angular, y estilos con Tailwind CSS usando CSS variables para theming.

## Prerequisitos

- **Node.js** ≥ 20.0.0
- **npm** ≥ 10.0.0 (viene con Node.js)
- **Acceso VPN** a la red BigSo (para SSO en desarrollo)
- **Ordamy Middleware** corriendo localmente o accesible
- **Cuenta BigSo SSO** para autenticación

## Setup Local

### 1. Clonar el repositorio

```sh
git clone https://github.com/bigso/ordamy.git
cd ordamy/ordamy-frontend
```

### 2. Instalar dependencias

```sh
npm install
```

### 3. Configurar HTTPS local (requerido para SSO)

El desarrollo local requiere HTTPS debido a la autenticación SSO. El proyecto está configurado para usar `mkcert`:

```sh
# Instalar mkcert si no lo tienes
brew install mkcert  # macOS
# o
npm install -g mkcert

# Instalar CA local
mkcert -install
```

### 4. Configurar variables de entorno

El frontend obtiene la configuración desde el archivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:4300/api',
  ssoUrl: 'https://sso.bigso.co',
  appId: 'ordamy'
};
```

### 5. Ejecutar

```sh
# Modo desarrollo con HTTPS (requerido)
npm run start:local

# O modo estándar (solo HTTP, sin SSO)
npm start
```

La aplicación estará disponible en `https://localhost:4001`.

::: tip Buena Práctica
Siempre usa `npm run start:local` para desarrollo completo con SSO. El comando estándar `npm start` no incluye los certificados necesarios para la autenticación federada.
:::

## Verificar que funciona

1. Abre `https://localhost:4001` en tu navegador
2. Acepta el certificado autofirmado si es necesario
3. La app debería redirigirte al login de BigSo SSO
4. Tras autenticarte, verás el dashboard de Ordamy

## Problemas Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| `ERR_CERT_AUTHORITY_INVALID` | Certificado autofirmado | Aceptar excepción en el navegador o verificar `mkcert -install` |
| `CORS error` en API calls | Middleware no accesible | Verificar que el middleware corra en el puerto configurado en `apiUrl` |
| `401 Unauthorized` constante | Cookie no incluida | Verificar configuración de HttpClient con `withCredentials` |
| `Cannot GET /` después de login | Redirección incorrecta | Verificar que `APP_ID` coincida en frontend y middleware |
| `TypeScript compilation errors` | Versiones incompatibles | Ejecutar `npm ci` para reinstalar dependencias exactas |
| `Module not found` | Imports rotos | Verificar que el archivo exista y la ruta sea correcta (case-sensitive) |

## Canales de Soporte

| Canal | Propósito |
|-------|-----------|
| #ordamy-team | Soporte general y consultas de frontend |
| #bigso-design-system | Dudas sobre componentes, tokens y UI |
| carlos@bigso.org | Escalamiento a Tech Lead |

## Estructura del Proyecto

```
ordamy-frontend/
├── src/
│   ├── app/
│   │   ├── core/                      # Servicios singleton, guards, interceptors
│   │   │   ├── guards/
│   │   │   │   ├── is-logged/        # Verifica sesión activa
│   │   │   │   ├── has-permission/   # Verifica RBAC
│   │   │   │   └── valid-tenant/     # Valida tenant en URLs públicas
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts
│   │   │   └── services/             # Servicios globales
│   │   │       ├── session/          # Gestión de sesión SSO
│   │   │       ├── customer/         # API clientes
│   │   │       ├── order/            # API órdenes
│   │   │       ├── expense/          # API egresos
│   │   │       ├── payment/          # API pagos
│   │   │       ├── account/          # API cuentas
│   │   │       ├── report/           # API reportes
│   │   │       ├── product/          # API productos
│   │   │       ├── material/         # API materiales
│   │   │       ├── settings/         # API configuración
│   │   │       └── ...
│   │   ├── modules/                   # Feature modules (lazy loaded)
│   │   │   ├── auth/                 # Login, logout, callback SSO
│   │   │   ├── dashboard/            # Dashboard principal
│   │   │   ├── orders/               # Gestión de órdenes
│   │   │   │   ├── order-create/
│   │   │   │   └── order-detail/
│   │   │   ├── customers/            # Gestión de clientes
│   │   │   ├── expenses/             # Gestión de egresos
│   │   │   ├── cashier/              # Caja/pagos
│   │   │   ├── portfolio/            # Cartera (órdenes con saldo)
│   │   │   ├── reports/              # Reportes financieros
│   │   │   ├── products/             # Catálogo de productos
│   │   │   ├── materials/            # Materiales/insumos
│   │   │   ├── settings/             # Configuración
│   │   │   ├── support/              # Soporte/ayuda
│   │   │   ├── logged-layout/        # Layout autenticado
│   │   │   ├── home/                 # Landing page
│   │   │   └── public/               # Portal público de clientes
│   │   ├── shared/                    # Componentes reutilizables
│   │   │   └── components/
│   │   ├── app.component.ts           # Root component
│   │   ├── app.config.ts              # Configuración Angular
│   │   └── app.routes.ts              # Definición de rutas
│   ├── environments/                  # Configuraciones por ambiente
│   ├── index.html                     # HTML entry point
│   ├── main.ts                        # Bootstrap Angular
│   └── styles.scss                    # Estilos globales + Tailwind
├── angular.json                       # Configuración CLI Angular
├── tailwind.config.js                 # Configuración Tailwind CSS
├── tsconfig.app.json                  # TypeScript config
└── package.json                       # Dependencias
```

## Arquitectura de Rutas

```
/                           → Home (landing)
/auth/*                     → Autenticación SSO
/dashboard                  → Dashboard principal (protegido)
/orders                     → Lista de órdenes (protegido)
/orders/new                 → Crear orden (protegido)
/orders/:id                 → Detalle orden (protegido)
/customers                  → Lista clientes (protegido)
/expenses                   → Egresos (protegido)
/cashier                    → Caja (protegido)
/portfolio                  → Cartera (protegido)
/reports                    → Reportes (protegido)
/products                   → Productos (protegido)
/materials                  → Materiales (protegido)
/settings                   → Configuración (protegido)
/org/*                      → Portal público (sin auth)
/portal-usuarios/:tenantSlug/*  → Portal clientes (valida tenant)
```

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Servidor dev HTTP (sin SSO) |
| `npm run start:local` | Servidor dev HTTPS con SSO |
| `npm run build` | Build production |
| `npm run watch` | Build desarrollo con watch |
| `npm test` | Tests unitarios (Karma) |
| `npm run format` | Formatear código con Prettier |
| `npm run format:check` | Verificar formato |

## Servicios Core

Los servicios en `core/services/` manejan la comunicación con la API:

| Servicio | Descripción |
|----------|-------------|
| `SessionService` | Autenticación, tokens, sesión de usuario |
| `CustomerService` | CRUD de clientes |
| `OrderService` | Gestión de órdenes y sus items |
| `ExpenseService` | Egresos y adjuntos |
| `PaymentService` | Registro de pagos |
| `AccountService` | Cuentas y transacciones |
| `ReportService` | Reportes financieros |
| `ProductService` | Catálogo de productos |
| `MaterialService` | Gestión de materiales |
| `SettingsService` | Configuración del tenant |

## Dependencias Principales

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@angular/core` | ^21.2.9 | Framework base |
| `@angular/common/http` | ^21.2.9 | Cliente HTTP |
| `@angular/router` | ^21.2.9 | Navegación SPA |
| `@angular/cdk` | ^20.2.14 | Component Development Kit |
| `rxjs` | ~7.8.0 | Programación reactiva |
| `tailwindcss` | ^3.4.19 | Framework CSS |
| `prettier` | ^3.5.3 | Formateo de código |

## Desarrollo con SSO

### Flujo de Autenticación Local

1. Accedes a `https://localhost:4001`
2. El guard `isLoggedGuard` detecta que no hay sesión
3. Redirección a BigSo SSO Portal
4. Tras login exitoso, SSO redirige a `/auth/callback`
5. El callback procesa tokens y establece sesión
6. Redirección al dashboard

### Verificar Permisos

Para desarrollar features con permisos específicos, asegúrate que tu usuario tenga los permisos en el portal SSO:

- `orders:read`, `orders:create`, `orders:edit`
- `customers:read`, `customers:create`
- `expenses:read`, `expenses:create`
- `cashier:read`
- `reports:read`
- `settings:read`
