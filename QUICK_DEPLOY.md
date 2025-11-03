# 🚀 Быстрая инструкция по деплою

## ✅ LiveKit CLI установлен (v2.12.3)

## Следующие шаги:

### 1. Аутентификация

```powershell
cd agents
lk cloud auth --api-key APIgEdUcFbCgkii
```

**Вам нужно будет ввести API Secret** из LiveKit Cloud Dashboard:
- Перейдите на https://cloud.livekit.io
- Откройте ваш проект
- Settings → Keys
- Скопируйте API Secret

### 2. Создание агента

```powershell
lk agent create
```

Интерактивные вопросы:
- **Agent name**: `doctor-agent`
- **Runtime**: `python` (или `python3`)
- **Entry point**: `doctor_agent.py`
- **Working directory**: `.` (текущая директория)

### 3. Настройка переменных окружения

В LiveKit Cloud Dashboard → ваш агент → Environment Variables:

```
LIVEKIT_URL=wss://shadowmedtech-k63v8iwv.livekit.cloud
LIVEKIT_API_KEY=APIgEdUcFbCgkii
LIVEKIT_API_SECRET=<ваш-секрет>
GIGACHAT_CLIENT_ID=0199824b-4c1e-7ef1-b423-bb3156ddecee
GIGACHAT_CLIENT_SECRET=46991ceb-e831-4b1a-b63a-25d18a37d5c7
GIGACHAT_AUTHORIZATION_KEY=MDE5OTgyNGItNGMxZS03ZWYxLWI0MjMtYmIzMTU2ZGRlY2VlOjQ2OTkxY2ViLWU4MzEtNGIxYS1iNjNhLTI1ZDE4YTM3ZDVjNw==
GIGACHAT_API_URL=https://gigachat.devices.sberbank.ru/api/v1
GIGACHAT_OAUTH_URL=https://ngw.devices.sberbank.ru:9443/api/v2/oauth
GIGACHAT_SCOPE=GIGACHAT_API_PERS
OPENAI_API_KEY=<ваш-openai-ключ>
NEXTJS_API_URL=https://your-app.vercel.app
AGENT_SERVICE_TOKEN=<ваш-служебный-токен>
USE_SILERO_TTS=true
USE_OPENAI_STT=true
```

### 4. Деплой

```powershell
lk agent deploy
```

### 5. Обновить конфигурацию

После успешного деплоя, в `.env.local` измените:

```env
LIVEKIT_CLOUD=true
```

## ⚠️ Важно

- Для аутентификации нужен **API Secret** (не API Key)
- Переменные окружения настраиваются в Dashboard (не в файлах)
- После деплоя агент будет автоматически вызываться при создании комнаты

## 📚 Полная инструкция

См. `DEPLOY.md` для детальной информации.

