# Python Excel Export - Setup (Best Practices)

## 1) Crear entorno virtual (recomendado)
```powershell
cd backend
python -m venv .venv
```

## 2) Activar entorno virtual
```powershell
.\.venv\Scripts\Activate.ps1
```

## 3) Instalar dependencias
```powershell
python -m pip install -r requirements.txt
```

## 4) Verificar instalación
```powershell
python -c "import xlsxwriter; print(xlsxwriter.__version__)"
```

## 5) Configurar VSCode
- `Python: Select Interpreter`
- Seleccionar `backend/.venv/Scripts/python.exe`

## Variables opcionales
- `PYTHON_EXECUTABLE`: intérprete para fallback local en Nest
- `EXCEL_PYTHON_EXPORT_URL`: URL de función Python en Vercel
- `EXCEL_EXPORT_INTERNAL_TOKEN`: token interno entre Nest y función Python
