# Тесты для LiveKit агентов

## Запуск тестов

### Требования

1. Установленные зависимости агента:
```bash
cd agents
python -m venv venv
venv\Scripts\activate  # Windows
# или
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

2. Настроенный `.env` файл в `agents/.env`:
```env
LIVEKIT_URL=wss://shadowmedtech-k63v8iwv.livekit.cloud
LIVEKIT_API_KEY=APIgEdUcFbCgkii
LIVEKIT_API_SECRET=your-secret
GIGACHAT_AUTHORIZATION_KEY=your-key
OPENAI_API_KEY=your-key
```

### Запуск теста подключения

```bash
python tests/agents/test-agent-connection.py
```

### Что проверяют тесты

1. **LiveKit Connection** - проверка конфигурации LiveKit
2. **GigaChat Token** - получение токена для GigaChat API
3. **OpenAI STT** - инициализация Speech-to-Text (если настроен)
4. **Silero TTS** - инициализация Text-to-Speech для русского языка

## Результаты

- ✅ PASSED - тест прошел успешно
- ❌ FAILED - тест провалился
- ⚠️ SKIPPED - тест пропущен (недостаточно конфигурации)

