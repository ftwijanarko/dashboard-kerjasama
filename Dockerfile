FROM nginx:stable-alpine

# Hapus default server config (nginx.conf tetap dipakai)
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config template (menggunakan $PORT dari Render)
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

# Copy semua file dashboard
COPY . /usr/share/nginx/html/

# Bersihkan file yang tidak perlu di image
RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/nginx.conf.template \
          /usr/share/nginx/html/.gitignore \
          /usr/share/nginx/html/README.md \
          /usr/share/nginx/html/requirement.md \
          /usr/share/nginx/html/sipedas.Suratkerjasama.*.html

# Render.com menggunakan PORT env var (default 10000)
ENV PORT=10000
EXPOSE 10000
