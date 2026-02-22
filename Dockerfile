# Etapa 1: Construcción
FROM public.ecr.aws/docker/library/node:20 AS build

WORKDIR /app

# Copiar solo package.json (sin lockfile para evitar bug npm optional deps)
COPY package.json ./

# Instalar dependencias frescas para la plataforma Linux
RUN npm install

# Copiar el resto de los archivos
COPY . .

# Construir Angular para producción
RUN npm run build -- --configuration production

# Etapa 2: Servidor Nginx
FROM public.ecr.aws/docker/library/nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist/ordamy-frontend/browser /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
