

echo "⏳ Esperando a que la base de datos esté disponible en $DATABASE_URL ..."

DB_HOST=$(echo "$DATABASE_URL" | sed -E 's#.*@([^:/]+):([0-9]+)/.*#\1#')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's#.*@([^:/]+):([0-9]+)/.*#\2#')

until nc -z "$DB_HOST" "$DB_PORT"; do
  echo "🚧 Esperando a que $DB_HOST:$DB_PORT esté disponible..."
  sleep 2
done

echo "✅ Base de datos disponible. Iniciando el backend..."
exec "$@"
