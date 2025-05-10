#!/bin/bash

# Скрипт для деплоя на GitHub Pages

# Перейти в директорию public
cd "$(dirname "$0")"

# Инициализировать git репозиторий, если его нет
if [ ! -d .git ]; then
  git init
  git checkout -b main
fi

# Добавить все файлы
git add .

# Создать коммит
git commit -m "Deploy to GitHub Pages"

# Настроить удаленный репозиторий (замените YOUR_USERNAME на ваше имя пользователя)
git remote add origin https://github.com/YOUR_USERNAME/wifilocate.git
# Если уже существует:
# git remote set-url origin https://github.com/YOUR_USERNAME/wifilocate.git

# Отправить на GitHub
git push -f origin main

echo "Деплой завершен!"