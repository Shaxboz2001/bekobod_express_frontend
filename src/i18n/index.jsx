// ─── Til moduli (Ўзбек кирилл / Рус) ────────────────────────────────────────
// Default:
//   • Telegram language_code='ru' → 'ru'
//   • boshqa har qanday → 'uz' (Кирилл)

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'bekobod_lang';

const messages = {
  // ═══ ЎЗБЕК (КИРИЛЛ) ════════════════════════════════════════════════════════
  uz: {
    'common.save':         'Сақлаш',
    'common.cancel':       'Бекор қилиш',
    'common.back':         'Орқага',
    'common.next':         'Кейингиси',
    'common.continue':     'Давом этиш',
    'common.submit':       'Юбориш',
    'common.confirm':      'Тасдиқлаш',
    'common.reject':       'Рад этиш',
    'common.edit':         'Таҳрирлаш',
    'common.delete':       'Ўчириш',
    'common.close':        'Ёпиш',
    'common.refresh':      'Янгилаш',
    'common.loading':      'Юкланмоқда...',
    'common.error':        'Хато юз берди',
    'common.retry':        'Қайта уриниш',
    'common.search':       'Қидириш',
    'common.required':     'Мажбурий',
    'common.optional':     'Ихтиёрий',
    'common.yes':          'Ҳа',
    'common.no':           'Йўқ',
    'common.contact':      'Боғланиш',
    'common.call':         'Қўнғироқ',
    'common.write':        'Ёзиш',
    'common.add':          'Қўшиш',
    'common.create':       'Яратиш',

    'app.title':           'Bekobod Express',
    'app.subtitle':        'Бекобод ↔ Тошкент',

    'auth.loading':                  'Кирилмоқда...',
    'auth.role.title':               'Ролни танланг',
    'auth.role.passenger':           'Йўловчи',
    'auth.role.passenger.desc':      'Тез рўйхатдан ўтиб, эълон беринг',
    'auth.role.driver':              'Ҳайдовчи',
    'auth.role.driver.desc':         'Машина маълумотларини киритинг (админ тасдиқлайди)',
    'auth.phone.label':              'Телефон рақам',
    'auth.phone.invalid':            'Тўғри телефон киритинг (998XXXXXXXXX)',
    'auth.phone.placeholder':        '901234567',
    'auth.passenger.title':          '👤 Йўловчи',
    'auth.passenger.subtitle':       'Телефон рақамингизни киритинг',
    'auth.driver.title':             '🚗 Ҳайдовчи',
    'auth.driver.step1':             '1/2: Телефон рақамингизни киритинг',
    'auth.driver.step2':             '2/2: Машинангиз ҳақида маълумот беринг',
    'auth.driver.step.phone':        'Телефон',
    'auth.driver.step.car':          'Машина',
    'auth.driver.step.confirm':      'Тасдиқ',
    'auth.driver.car.title':         '🚗 Машина маълумотлари',
    'auth.driver.car.model':         'Машина модели',
    'auth.driver.car.model.ph':      'Масалан: Chevrolet Cobalt',
    'auth.driver.car.number':        'Давлат рақами',
    'auth.driver.car.year':          'Йили',
    'auth.driver.car.color':         'Ранги',
    'auth.driver.car.color.ph':      'Оқ',
    'auth.driver.car.type':          'Машина тури',
    'auth.driver.car.type.sedan':    '🚙 Седан',
    'auth.driver.car.type.minivan':  '🚐 Минивэн',
    'auth.driver.car.type.cargo':    '🚛 Юк машинаси',
    'auth.driver.car.license':       'Гувоҳнома рақами',
    'auth.driver.car.seats':         'Жойлар',
    'auth.driver.car.notice':        'Маълумотларни жўнатгач, админ тасдиқлаши керак. Тасдиқлангач Телеграмда хабар оласиз.',
    'auth.pending.title':            'Тасдиқ кутилмоқда ⏳',
    'auth.pending.body':             'Админ сизнинг маълумотларингизни текширмоқда. Тасдиқлангач Телеграмга хабар келади ва автоматик кирасиз.',
    'auth.pending.step1':            '📋 Админ маълумотларни текширади',
    'auth.pending.step2':            '📩 Телеграмда хабар келади',
    'auth.pending.step3':            '✅ Автоматик кириш фаоллашади',
    'auth.pending.checking':         'Автоматик текширилмоқда...',
    'auth.pending.checkNow':         '🔄 Ҳозир текшириш',
    'auth.error.notInsideTelegram':  'Бу илова фақат Телеграм орқали ишлайди. Телеграмда ботни очинг ва /start босинг.',
    'auth.error.tgUserMissing':      'Телеграм маълумотлари келмади. Қайтадан уриниб кўринг.',
    'auth.error.fromTelegram':       'Телеграмдан',
    'auth.error.title':              'Хато юз берди',

    'nav.newTrip':         'Эълон',
    'nav.myTrips':         'Тарихим',
    'nav.activeTrips':     'Эълонлар',
    'nav.profile':         'Профил',
    'nav.driverTrips':     'Менинг',

    'trip.id':                 'Эълон',
    'trip.route':              'Маршрут',
    'trip.pickup':             'Қабул жойи',
    'trip.dropoff':            'Етказиш жойи',
    'trip.details':            'Тафсилотлар',
    'trip.time':               'Вақт',
    'trip.seats':              'Жойлар',
    'trip.seats.unit':         'та',
    'trip.category':           'Тоифа',
    'trip.carType':            'Машина тури',
    'trip.luggage':            'Юк',
    'trip.luggage.has':        'Бор',
    'trip.notes':              'Изоҳ',
    'trip.price':              'Нарх',
    'trip.pricePerSeat':       'Нарх (жой бошига)',
    'trip.totalPrice':         'Умумий',
    'trip.driver':             'Ҳайдовчи',
    'trip.passenger':          'Йўловчи',
    'trip.car':                'Машина',
    'trip.carNumber':          'Давлат рақами',
    'trip.rating':             'Рейтинг',
    'trip.cancellationReason': 'Бекор қилиш сабаби',
    'trip.startTrip':          '🚗 Сафарни бошлаш',
    'trip.completeTrip':       '🏁 Сафарни якунлаш',
    'trip.accept':             '✅ Қабул қилиш',
    'trip.cancel':             '❌ Бекор қилиш',
    'trip.cancel.title':       'Эълонни бекор қилиш',
    'trip.cancel.reason':      'Сабаб (ихтиёрий)',
    'trip.cancel.placeholder': 'Нима учун бекор қиляпсиз?',
    'trip.notFound':           'Эълон топилмади',
    'trip.empty':              'Эълонлар топилмади',
    'trip.detail':             'Батафсил',
    'trip.new':                'Янги эълон',

    'status.active':       'Кутилмоқда',
    'status.accepted':     'Қабул қилинди',
    'status.in_progress':  'Йўлда',
    'status.completed':    'Якунланди',
    'status.cancelled':    'Бекор қилинди',
    'status.expired':      'Муддати ўтди',

    'cat.passenger':              'Йўловчи',
    'cat.passenger_small_cargo':  'Йўловчи + кичик юк',
    'cat.cargo':                  'Юк ташиш',

    'dir.bekobod_to_tashkent':  'Бекобод → Тошкент',
    'dir.tashkent_to_bekobod':  'Тошкент → Бекобод',

    'newTrip.title':           'Янги эълон',
    'newTrip.direction':       'Йўналиш',
    'newTrip.pickup':          'Қабул жойи',
    'newTrip.dropoff':         'Етказиш жойи',
    'newTrip.date':            'Сана',
    'newTrip.time':            'Вақт',
    'newTrip.seats':           'Нечта жой керак?',
    'newTrip.category':        'Тоифа',
    'newTrip.carType':         'Машина тури (ихтиёрий)',
    'newTrip.luggage':         'Юк бор',
    'newTrip.notes':           'Изоҳ (ихтиёрий)',
    'newTrip.notes.ph':        'Масалан: эрталаб 8 да',
    'newTrip.publish':         'Эълон бериш',
    'newTrip.success':         '✅ Эълон жўнатилди! Ҳайдовчилар кўради.',
    'newTrip.priceMissing':    'Бу йўналиш учун нарх белгиланмаган. Админ билан боғланинг.',
    'newTrip.summary':         'Хулоса',
    'newTrip.totalPrice':      'Умумий нарх',

    'profile.title':         'Профил',
    'profile.verified':      '✓ Тасдиқланган',
    'profile.driver.info':   'Ҳайдовчи маълумотлари',
    'profile.account':       'Ҳисоб маълумотлари',
    'profile.logout':        'Чиқиш',
    'profile.lang':          'Тил',
    'profile.statusOn':      'Фаол — эълонларни кўрасиз',
    'profile.statusOff':     'Банд — эълонлар кўринмайди',

    // ═ Admin ═
    'admin.title':                   'Админ панел',
    'admin.nav.dashboard':           'Бошқарув панели',
    'admin.nav.trips':               'Эълонлар',
    'admin.nav.users':               'Фойдаланувчилар',
    'admin.nav.drivers':             'Ҳайдовчилар',
    'admin.nav.pricing':             'Нархлар',

    'admin.login.title':             'Админ кириш',
    'admin.login.subtitle':          'Тизимга кириш учун маълумотларингизни киритинг',
    'admin.login.phone':             'Телефон рақам',
    'admin.login.password':          'Парол',
    'admin.login.submit':            'Кириш',
    'admin.login.invalid':           'Телефон ёки парол нотўғри',

    'admin.dashboard.title':         'Бошқарув панели',
    'admin.dashboard.totalUsers':    'Жами фойдаланувчилар',
    'admin.dashboard.totalDrivers':  'Ҳайдовчилар',
    'admin.dashboard.totalTrips':    'Жами эълонлар',
    'admin.dashboard.activeTrips':   'Фаол эълонлар',
    'admin.dashboard.completed':     'Якунланган',
    'admin.dashboard.pending':       'Тасдиқ кутаётганлар',
    'admin.dashboard.recentTrips':   'Сўнгги эълонлар',
    'admin.dashboard.viewAll':       'Барчасини кўриш',

    'admin.users.title':             'Фойдаланувчилар',
    'admin.users.empty':             'Фойдаланувчилар йўқ',
    'admin.users.role':              'Роли',
    'admin.users.role.passenger':    'Йўловчи',
    'admin.users.role.driver':       'Ҳайдовчи',
    'admin.users.role.admin':        'Админ',
    'admin.users.verified':          'Тасдиқланган',
    'admin.users.notVerified':       'Тасдиқланмаган',
    'admin.users.active':            'Фаол',
    'admin.users.blocked':           'Блокланган',
    'admin.users.block':             'Блоклаш',
    'admin.users.unblock':           'Блокдан чиқариш',
    'admin.users.created':           'Рўйхатдан ўтган',
    'admin.users.search':            'Исм ёки телефон бўйича қидириш',

    'admin.drivers.title':           'Ҳайдовчилар',
    'admin.drivers.tab.pending':     'Кутилмоқда',
    'admin.drivers.tab.verified':    'Тасдиқланган',
    'admin.drivers.tab.all':         'Барчаси',
    'admin.drivers.empty.pending':   'Тасдиқ кутаётган ҳайдовчилар йўқ',
    'admin.drivers.empty.verified':  'Тасдиқланган ҳайдовчилар йўқ',
    'admin.drivers.empty.all':       'Ҳайдовчилар йўқ',
    'admin.drivers.verify':          'Тасдиқлаш',
    'admin.drivers.reject':          'Рад этиш',
    'admin.drivers.confirmVerify.title':  'Ҳайдовчини тасдиқлаш',
    'admin.drivers.confirmVerify.body':   'Ҳайдовчи тасдиқлансин? У Telegram орқали хабар олади ва тизимга кира олади.',
    'admin.drivers.confirmReject.title':  'Ҳайдовчини рад этиш',
    'admin.drivers.confirmReject.body':   'Ҳайдовчи рад этилсинми? У Telegram орқали хабар олади.',
    'admin.drivers.verifySuccess':   '✅ Ҳайдовчи тасдиқланди',
    'admin.drivers.rejectSuccess':   '❌ Ҳайдовчи рад этилди',
    'admin.drivers.car':             'Машина',
    'admin.drivers.carNumber':       'Давлат рақами',
    'admin.drivers.license':         'Гувоҳнома',
    'admin.drivers.totalTrips':      'Жами сафарлар',
    'admin.drivers.rating':          'Рейтинг',

    'admin.trips.title':             'Эълонлар',
    'admin.trips.empty':             'Эълонлар йўқ',
    'admin.trips.filter.all':        'Барчаси',
    'admin.trips.filter.status':     'Ҳолати',
    'admin.trips.filter.direction':  'Йўналиш',

    'admin.pricing.title':           'Нархлар',
    'admin.pricing.empty':           'Нархлар белгиланмаган',
    'admin.pricing.add':             'Янги нарх қўшиш',
    'admin.pricing.edit':            'Таҳрирлаш',
    'admin.pricing.direction':       'Йўналиш',
    'admin.pricing.category':        'Тоифа',
    'admin.pricing.pricePerSeat':    'Жой бошига нарх',
    'admin.pricing.minSeats':        'Минимал жойлар',
    'admin.pricing.maxSeats':        'Максимал жойлар',
    'admin.pricing.saved':           '💾 Нарх сақланди',
    'admin.pricing.deleted':         '🗑️ Нарх ўчирилди',
    'admin.pricing.confirmDelete':   'Нархни ўчиришни хоҳлайсизми?',

    'admin.tripDetail.back':         'Эълонлар рўйхатига',
    'admin.tripDetail.passengerInfo': 'Йўловчи маълумотлари',
    'admin.tripDetail.driverInfo':    'Ҳайдовчи маълумотлари',
  },

  // ═══ РУС ═════════════════════════════════════════════════════════════════
  ru: {
    'common.save':         'Сохранить',
    'common.cancel':       'Отмена',
    'common.back':         'Назад',
    'common.next':         'Далее',
    'common.continue':     'Продолжить',
    'common.submit':       'Отправить',
    'common.confirm':      'Подтвердить',
    'common.reject':       'Отклонить',
    'common.edit':         'Изменить',
    'common.delete':       'Удалить',
    'common.close':        'Закрыть',
    'common.refresh':      'Обновить',
    'common.loading':      'Загрузка...',
    'common.error':        'Произошла ошибка',
    'common.retry':        'Повторить',
    'common.search':       'Поиск',
    'common.required':     'Обязательно',
    'common.optional':     'Необязательно',
    'common.yes':          'Да',
    'common.no':           'Нет',
    'common.contact':      'Связаться',
    'common.call':         'Позвонить',
    'common.write':        'Написать',
    'common.add':          'Добавить',
    'common.create':       'Создать',

    'app.title':           'Bekobod Express',
    'app.subtitle':        'Бекабад ↔ Ташкент',

    'auth.loading':                  'Вход...',
    'auth.role.title':               'Выберите роль',
    'auth.role.passenger':           'Пассажир',
    'auth.role.passenger.desc':      'Быстрая регистрация и заказ',
    'auth.role.driver':              'Водитель',
    'auth.role.driver.desc':         'Введите данные машины (админ подтвердит)',
    'auth.phone.label':              'Номер телефона',
    'auth.phone.invalid':            'Введите корректный номер (998XXXXXXXXX)',
    'auth.phone.placeholder':        '901234567',
    'auth.passenger.title':          '👤 Пассажир',
    'auth.passenger.subtitle':       'Введите номер телефона',
    'auth.driver.title':             '🚗 Водитель',
    'auth.driver.step1':             '1/2: Введите номер телефона',
    'auth.driver.step2':             '2/2: Расскажите о машине',
    'auth.driver.step.phone':        'Телефон',
    'auth.driver.step.car':          'Машина',
    'auth.driver.step.confirm':      'Подтверждение',
    'auth.driver.car.title':         '🚗 Данные машины',
    'auth.driver.car.model':         'Модель машины',
    'auth.driver.car.model.ph':      'Например: Chevrolet Cobalt',
    'auth.driver.car.number':        'Гос. номер',
    'auth.driver.car.year':          'Год',
    'auth.driver.car.color':         'Цвет',
    'auth.driver.car.color.ph':      'Белый',
    'auth.driver.car.type':          'Тип машины',
    'auth.driver.car.type.sedan':    '🚙 Седан',
    'auth.driver.car.type.minivan':  '🚐 Минивэн',
    'auth.driver.car.type.cargo':    '🚛 Грузовая',
    'auth.driver.car.license':       'Номер прав',
    'auth.driver.car.seats':         'Места',
    'auth.driver.car.notice':        'После отправки админ должен подтвердить. Подтверждение придёт в Telegram.',
    'auth.pending.title':            'Ожидание подтверждения ⏳',
    'auth.pending.body':             'Админ проверяет ваши данные. После подтверждения вы получите сообщение в Telegram и автоматически войдёте.',
    'auth.pending.step1':            '📋 Админ проверяет данные',
    'auth.pending.step2':            '📩 Сообщение придёт в Telegram',
    'auth.pending.step3':            '✅ Вход активируется автоматически',
    'auth.pending.checking':         'Автоматическая проверка...',
    'auth.pending.checkNow':         '🔄 Проверить сейчас',
    'auth.error.notInsideTelegram':  'Приложение работает только через Telegram. Откройте бота и нажмите /start.',
    'auth.error.tgUserMissing':      'Данные Telegram не получены. Попробуйте снова.',
    'auth.error.fromTelegram':       'из Telegram',
    'auth.error.title':              'Произошла ошибка',

    'nav.newTrip':         'Заявка',
    'nav.myTrips':         'История',
    'nav.activeTrips':     'Заявки',
    'nav.profile':         'Профиль',
    'nav.driverTrips':     'Мои',

    'trip.id':                 'Заявка',
    'trip.route':              'Маршрут',
    'trip.pickup':             'Откуда',
    'trip.dropoff':            'Куда',
    'trip.details':            'Детали',
    'trip.time':               'Время',
    'trip.seats':              'Места',
    'trip.seats.unit':         'мест',
    'trip.category':           'Категория',
    'trip.carType':            'Тип машины',
    'trip.luggage':            'Багаж',
    'trip.luggage.has':        'Есть',
    'trip.notes':              'Примечание',
    'trip.price':              'Цена',
    'trip.pricePerSeat':       'Цена (за место)',
    'trip.totalPrice':         'Итого',
    'trip.driver':             'Водитель',
    'trip.passenger':          'Пассажир',
    'trip.car':                'Машина',
    'trip.carNumber':          'Гос. номер',
    'trip.rating':             'Рейтинг',
    'trip.cancellationReason': 'Причина отмены',
    'trip.startTrip':          '🚗 Начать поездку',
    'trip.completeTrip':       '🏁 Завершить поездку',
    'trip.accept':             '✅ Принять',
    'trip.cancel':             '❌ Отменить',
    'trip.cancel.title':       'Отменить заявку',
    'trip.cancel.reason':      'Причина (необязательно)',
    'trip.cancel.placeholder': 'Почему отменяете?',
    'trip.notFound':           'Заявка не найдена',
    'trip.empty':              'Заявок нет',
    'trip.detail':             'Подробнее',
    'trip.new':                'Новая заявка',

    'status.active':       'Ожидает',
    'status.accepted':     'Принят',
    'status.in_progress':  'В пути',
    'status.completed':    'Завершён',
    'status.cancelled':    'Отменён',
    'status.expired':      'Истёк',

    'cat.passenger':              'Пассажир',
    'cat.passenger_small_cargo':  'Пассажир + малый груз',
    'cat.cargo':                  'Грузоперевозка',

    'dir.bekobod_to_tashkent':  'Бекабад → Ташкент',
    'dir.tashkent_to_bekobod':  'Ташкент → Бекабад',

    'newTrip.title':           'Новая заявка',
    'newTrip.direction':       'Направление',
    'newTrip.pickup':          'Откуда',
    'newTrip.dropoff':         'Куда',
    'newTrip.date':            'Дата',
    'newTrip.time':            'Время',
    'newTrip.seats':           'Сколько мест?',
    'newTrip.category':        'Категория',
    'newTrip.carType':         'Тип машины (необязательно)',
    'newTrip.luggage':         'Есть багаж',
    'newTrip.notes':           'Примечание (необязательно)',
    'newTrip.notes.ph':        'Например: утром в 8',
    'newTrip.publish':         'Опубликовать',
    'newTrip.success':         '✅ Заявка отправлена! Водители увидят.',
    'newTrip.priceMissing':    'Для этого направления цена не установлена. Свяжитесь с админом.',
    'newTrip.summary':         'Итог',
    'newTrip.totalPrice':      'Общая цена',

    'profile.title':         'Профиль',
    'profile.verified':      '✓ Подтверждён',
    'profile.driver.info':   'Данные водителя',
    'profile.account':       'Данные аккаунта',
    'profile.logout':        'Выйти',
    'profile.lang':          'Язык',
    'profile.statusOn':      'Активен — видите заявки',
    'profile.statusOff':     'Занят — заявки не видны',

    // ═ Admin ═
    'admin.title':                   'Админ панель',
    'admin.nav.dashboard':           'Панель управления',
    'admin.nav.trips':               'Заявки',
    'admin.nav.users':               'Пользователи',
    'admin.nav.drivers':             'Водители',
    'admin.nav.pricing':             'Цены',

    'admin.login.title':             'Вход админа',
    'admin.login.subtitle':          'Введите данные для входа',
    'admin.login.phone':             'Номер телефона',
    'admin.login.password':          'Пароль',
    'admin.login.submit':            'Войти',
    'admin.login.invalid':           'Неверный телефон или пароль',

    'admin.dashboard.title':         'Панель управления',
    'admin.dashboard.totalUsers':    'Всего пользователей',
    'admin.dashboard.totalDrivers':  'Водители',
    'admin.dashboard.totalTrips':    'Всего заявок',
    'admin.dashboard.activeTrips':   'Активные заявки',
    'admin.dashboard.completed':     'Завершено',
    'admin.dashboard.pending':       'Ждут подтверждения',
    'admin.dashboard.recentTrips':   'Последние заявки',
    'admin.dashboard.viewAll':       'Показать все',

    'admin.users.title':             'Пользователи',
    'admin.users.empty':             'Пользователей нет',
    'admin.users.role':              'Роль',
    'admin.users.role.passenger':    'Пассажир',
    'admin.users.role.driver':       'Водитель',
    'admin.users.role.admin':        'Админ',
    'admin.users.verified':          'Подтверждён',
    'admin.users.notVerified':       'Не подтверждён',
    'admin.users.active':            'Активен',
    'admin.users.blocked':           'Заблокирован',
    'admin.users.block':             'Заблокировать',
    'admin.users.unblock':           'Разблокировать',
    'admin.users.created':           'Зарегистрирован',
    'admin.users.search':            'Поиск по имени или телефону',

    'admin.drivers.title':           'Водители',
    'admin.drivers.tab.pending':     'Ожидают',
    'admin.drivers.tab.verified':    'Подтверждены',
    'admin.drivers.tab.all':         'Все',
    'admin.drivers.empty.pending':   'Нет водителей, ожидающих подтверждения',
    'admin.drivers.empty.verified':  'Нет подтверждённых водителей',
    'admin.drivers.empty.all':       'Водителей нет',
    'admin.drivers.verify':          'Подтвердить',
    'admin.drivers.reject':          'Отклонить',
    'admin.drivers.confirmVerify.title':  'Подтвердить водителя',
    'admin.drivers.confirmVerify.body':   'Подтвердить водителя? Он получит уведомление в Telegram и сможет войти.',
    'admin.drivers.confirmReject.title':  'Отклонить водителя',
    'admin.drivers.confirmReject.body':   'Отклонить водителя? Он получит уведомление в Telegram.',
    'admin.drivers.verifySuccess':   '✅ Водитель подтверждён',
    'admin.drivers.rejectSuccess':   '❌ Водитель отклонён',
    'admin.drivers.car':             'Машина',
    'admin.drivers.carNumber':       'Гос. номер',
    'admin.drivers.license':         'Права',
    'admin.drivers.totalTrips':      'Всего поездок',
    'admin.drivers.rating':          'Рейтинг',

    'admin.trips.title':             'Заявки',
    'admin.trips.empty':             'Заявок нет',
    'admin.trips.filter.all':        'Все',
    'admin.trips.filter.status':     'Статус',
    'admin.trips.filter.direction':  'Направление',

    'admin.pricing.title':           'Цены',
    'admin.pricing.empty':           'Цены не установлены',
    'admin.pricing.add':             'Добавить цену',
    'admin.pricing.edit':            'Изменить',
    'admin.pricing.direction':       'Направление',
    'admin.pricing.category':        'Категория',
    'admin.pricing.pricePerSeat':    'Цена за место',
    'admin.pricing.minSeats':        'Мин. мест',
    'admin.pricing.maxSeats':        'Макс. мест',
    'admin.pricing.saved':           '💾 Цена сохранена',
    'admin.pricing.deleted':         '🗑️ Цена удалена',
    'admin.pricing.confirmDelete':   'Удалить цену?',

    'admin.tripDetail.back':         'К списку заявок',
    'admin.tripDetail.passengerInfo': 'Данные пассажира',
    'admin.tripDetail.driverInfo':    'Данные водителя',
  },
};

// ─── Til aniqlash ────────────────────────────────────────────────────────────
const SUPPORTED = ['uz', 'ru'];

function detectLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch (_) {}

  const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  if (tgLang) {
    const short = tgLang.toLowerCase().split('-')[0];
    if (short === 'ru') return 'ru';
  }

  const navLang = navigator.language?.toLowerCase().split('-')[0];
  if (navLang === 'ru') return 'ru';

  return 'uz';
}

let currentLang = detectLang();

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (!SUPPORTED.includes(lang)) return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (_) {}
  listeners.forEach((l) => l(lang));
}

export function t(key, lang = currentLang) {
  return messages[lang]?.[key] ?? messages.uz[key] ?? key;
}

const listeners = new Set();

export const I18nContext = createContext({ lang: 'uz', setLang });

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(currentLang);

  useEffect(() => {
    const listener = (newLang) => setLangState(newLang);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  return (
    <I18nContext.Provider value={{ lang, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const { lang } = useContext(I18nContext);
  return useCallback((key) => t(key, lang), [lang]);
}

export function useLang() {
  return useContext(I18nContext);
}
