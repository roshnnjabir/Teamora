# Teamora

**Teamora** is a personal ERP SaaS project focused on scalable and modular project management. It’s built using Django, Django REST Framework, and React, and supports multi-tenant architecture using `django-tenants`. This project is in its MVP stage with a completed project management module and plans to expand into HR, CRM, and Finance in the future.

---

## 🚀 Features

- ✅ Project & Task management with subtasks  
- ✅ Drag-and-drop Kanban interface  
- ✅ Role-based access (Admin, Project Manager, Developer)  
- ✅ Multi-tenant architecture with subdomain routing  
- ✅ Real-time updates using Django Channels + Redis  
- ✅ Modular monolithic structure with DRY principles  
- 🚧 More ERP modules planned (HR, CRM, Finance)  

---

## 🛠 Tech Stack

**Backend:**
- Django  
- Django REST Framework  
- django-tenants  
- PostgreSQL (schema-based multi-tenancy)  
- Redis  
- Django Channels  
- JWT Authentication  

**Frontend:**
- React  
- Redux Toolkit  
- React Router  
- TailwindCSS  
- Axios (with tenant-aware API client)  

---

## 🧱 Project Structure

```
teamora/
├── backend/             # Django project with modular apps
│   ├── apps/            # Project, Task, User, etc.
│   ├── core/            # Shared utilities, base models
│   └── tenants/         # Tenant and Domain models
├── frontend/            # React frontend
│   ├── components/      
│   ├── features/        
│   └── pages/           
└── README.md
```

---

## ⚙️ Setup Instructions (Local Dev)

### 📦 Backend (non-Docker)

```bash
cd backend
python -m venv env
source env/bin/activate  # or .\env\Scripts\activate on Windows
pip install -r requirements.txt
```

#### Run Migrations

**Migrate public schema first:**

```bash
python manage.py migrate_schemas --schema=public
```

**Then apply tenant migrations:**

```bash
python manage.py migrate_schemas --tenant
```

> 💡 Or just run for all:
```bash
python manage.py migrate_schemas
```

#### Create Superuser (for public schema)

```bash
python manage.py createsuperuser --schema=public
```

#### Run the server

```bash
python manage.py runserver
```

---

## 🐳 Docker Setup (Recommended for consistent dev)

### Prerequisites

- Docker + Docker Compose installed

### Build and Start

```bash
docker compose up --build
```

Backend will be available at:  
`http://localhost:8000/`

### Common Docker Commands

- Restart:  
  ```bash
  docker compose restart
  ```

- Shut down:  
  ```bash
  docker compose down
  ```

- Access backend container:  
  ```bash
  docker compose exec teamora-backend bash
  ```

- Django shell inside container:  
  ```bash
  docker compose exec teamora-backend python manage.py shell
  ```

---

## 🏗 Creating a New Tenant

Run the Django shell:

```bash
python manage.py shell
```

Then create a tenant and domain (example):

```python
from tenants.models import Client, Domain

tenant = Client(
    name="Acme Corp",
    schema_name="acme",
    paid_until="2026-01-01",
    on_trial=True
)
tenant.save()

domain = Domain()
domain.domain = "acme.localhost"  # Use actual subdomain in production
domain.tenant = tenant
domain.is_primary = True
domain.save()
```

> 🔁 Visit your tenant at `http://acme.localhost:8000/`  
> Make sure you have proper DNS or local hosts entry.

---

## 🌱 Environment Variables

Create a `.env` file (or use `.env.example`) in your `backend/` folder for things like:

```dotenv
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

---

## 📈 Roadmap

- [x] Project & task management (MVP)  
- [x] Subtask support & assignment  
- [x] Role-based access  
- [x] Multi-tenancy support  
- [x] Drag-and-drop Kanban  
- [ ] HR module  
- [ ] CRM module  
- [ ] Finance module  
- [ ] Notification center  
- [ ] Audit logs & activity tracking  
- [ ] Admin dashboard for tenants  
- [ ] Mobile optimization  

---

## 👨‍💻 Author

**Roshan J.**  
Built with ❤️ to learn, scale, and experiment with modern ERP design and architecture.

---

## 📄 License

Teamora is licensed under the [MIT License](LICENSE).