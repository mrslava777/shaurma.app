# 🌯 Шаурма на Левкова — Flutter App

Приложение для Android на Flutter с автоматической сборкой APK через GitHub Actions.

## 🚀 Как получить APK (с телефона!)

### Шаг 1: Создайте репозиторий на GitHub
1. Откройте [github.com](https://github.com) в браузере телефона
2. Нажмите **+** → **New repository**
3. Название: `shaurma-levkova-app`
4. Нажмите **Create repository**

### Шаг 2: Загрузите файлы
1. В репозитории нажмите **uploading an existing file**
2. Выберите ZIP-файл этого проекта (предварительно распакуйте)
3. Или используйте GitHub App → загрузите все файлы

### Шаг 3: Запустите сборку
1. Перейдите во вкладку **Actions**
2. Нажмите **Build APK** → **Run workflow**
3. Ждите 5–10 минут

### Шаг 4: Скачайте APK
1. Перейдите во вкладку **Releases** (справа)
2. Откройте последний релиз
3. Скачайте `app-release.apk`
4. Установите на телефон

## ⚙️ Настройка API

В `lib/services/api_service.dart` замените URL бэкенда:
```dart
static const String baseUrl = 'https://your-render-url.onrender.com';
```

## 📱 Скриншоты

| Меню | Корзина | Заказы |
|------|---------|--------|
| Карточки с фото | Товары + форма | Статусы заказов |

## 🛠️ Ручная сборка (если есть компьютер)

```bash
flutter pub get
flutter build apk --release
```

APK будет в: `build/app/outputs/flutter-apk/app-release.apk`
