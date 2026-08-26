# Static portfolio site. Nothing to build: nginx serves site/ as-is.
FROM nginx:1.27-alpine

# Fly's default internal_port; nginx.conf below binds it.
EXPOSE 8080

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/snippets/ /etc/nginx/snippets/
COPY site/ /usr/share/nginx/html/

# Fail the build, not the deploy, on a bad directive. nginx -t parses the whole
# config including the snippet include above.
RUN nginx -t

# Run as an unprivileged user. nginx:alpine ships the 'nginx' user (101).
RUN touch /var/run/nginx.pid \
 && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /usr/share/nginx/html
USER nginx

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
