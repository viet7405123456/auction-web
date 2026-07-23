# Auction Web Platform

Repository nay gom 3 project chinh:

- `auction-web-front-end`: giao dien nguoi dung (React + Vite)
- `auction-web-admin`: giao dien quan tri (React + Vite)
- `auction-web-backend`: API backend (Spring Boot + PostgreSQL + Redis)

He thong ho tro:

- Dang ky / dang nhap / refresh token (JWT)
- Dat gia thoi gian thuc, chat va notification qua WebSocket
- Quan ly du lieu voi PostgreSQL va Redis

## 1) Yeu cau moi truong

- Node.js 22.x (hoac moi hon, khuyen nghi LTS)
- npm 10+
- Java 21
- Maven 3.9+
- Docker Desktop (de chay PostgreSQL/Redis va chay image)

## 2) Cau truc nhanh

```text
project-ttcs/
	auction-web-front-end/
	auction-web-admin/
	auction-web-backend/
```

## 3) Chay du an local (khuyen nghi cho dev)

### Buoc 1: Chay PostgreSQL + Redis

Tu thu muc `auction-web-backend`, chay:

```bash
docker compose up -d
```

Mac dinh theo `docker-compose.yml`:

- PostgreSQL: `localhost:5432`
	- DB: `auction_db`
	- User: `test_db`
	- Password: `123456`
- Redis: `localhost:6379`

### Buoc 2: Chay backend

Tu thu muc `auction-web-backend`:

```bash
mvn spring-boot:run
```

Backend mac dinh chay o `http://localhost:8080`.

Swagger UI:

- `http://localhost:8080/swagger-ui.html`

### Buoc 3: Chay frontend user

Tu thu muc `auction-web-front-end`:

```bash
npm install
npm run dev
```

Tuỳ chon tao file `.env` trong `auction-web-front-end`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_BASE_URL=http://localhost:8080
```

Neu khong set, app se fallback theo host hien tai va cong `8080`.

### Buoc 4: Chay frontend admin

Tu thu muc `auction-web-admin`:

```bash
npm install
npm run dev
```

Luu y: admin hien dang goi API hardcode ve `http://localhost:8080`.

## 4) Chay bang Docker (tung service)

> Do backend can PostgreSQL + Redis, ban nen chay `docker compose up -d` trong `auction-web-backend` truoc.

### 4.1 Build image

```bash
docker build -t auction-backend:latest ./auction-web-backend
docker build -t auction-frontend:latest ./auction-web-front-end
docker build -t auction-admin:latest ./auction-web-admin
```

Frontend user co build args (neu can):

```bash
docker build \
	--build-arg VITE_API_BASE_URL=http://localhost:8080/api \
	--build-arg VITE_WS_BASE_URL=http://localhost:8080 \
	-t auction-frontend:latest ./auction-web-front-end
```

### 4.2 Run container

Backend (truy cap DB/Redis dang chay tren host Docker Desktop):

```bash
docker run -d --name auction-backend -p 8080:8080 \
	-e DB_URL=jdbc:postgresql://host.docker.internal:5432/auction_db \
	-e DB_USERNAME=test_db \
	-e DB_PASSWORD=123456 \
	-e REDIS_HOST=host.docker.internal \
	-e REDIS_PORT=6379 \
	auction-backend:latest
```

Frontend user:

```bash
docker run -d --name auction-frontend -p 3000:80 auction-frontend:latest
```

Frontend admin:

```bash
docker run -d --name auction-admin -p 3001:80 auction-admin:latest
```

Truy cap:

- User site: `http://localhost:3000`
- Admin site: `http://localhost:3001`
- Backend API: `http://localhost:8080`

## 5) Kiem tra Dockerfile cua ca 3 project

### Danh gia nhanh

- `auction-web-backend/Dockerfile`
	- Da dung multi-stage build (Maven builder + JRE runtime)
	- Da chay non-root user trong runtime
	- Cau truc tot cho production
- `auction-web-front-end/Dockerfile`
	- Da dung multi-stage build (Node build + Nginx runtime)
	- Da co `ARG/ENV` cho `VITE_API_BASE_URL`, `VITE_WS_BASE_URL`
	- Cau hinh Nginx co `try_files` phu hop SPA
- `auction-web-admin/Dockerfile`
	- Da dung multi-stage build (Node build + Nginx runtime)
	- Cau hinh Nginx SPA on dinh

### Ket luan

- Ve mat cau truc Dockerfile: ca 3 file deu on va dung huong.
- Can luu y van de runtime khong nam trong Dockerfile:
	- `auction-web-admin` dang hardcode API ve `http://localhost:8080` trong code, nen khi deploy xa host can doi lai co che config runtime/build-time.

### Lenh build nhanh de tu kiem tra

```bash
docker build -t check-admin ./auction-web-admin
docker build -t check-backend ./auction-web-backend
docker build -t check-frontend ./auction-web-front-end
```

Neu gap loi ket noi Docker daemon tren Windows, can mo Docker Desktop va cho engine len hoan toan truoc khi build.

## 6) Day Dockerfile + README len GitHub

Tu root repo (`project-ttcs`), chay:

```bash
git add README.md auction-web-admin/Dockerfile auction-web-backend/Dockerfile auction-web-front-end/Dockerfile
git commit -m "docs: update run guide and docker workflow"
git push origin main
```

Neu branch hien tai khac `main`, thay `main` bang ten branch cua ban.
