# Wi-Fi Device Runbook (Android + iOS)

Этот файл описывает запуск ChatUp на реальных устройствах по Wi-Fi с командами и порядком действий.

## Preconditions (for both Android and iOS)

- ПК и телефон в одной локальной сети Wi-Fi.
- Backend и Frontend доступны в локалке.
- На ПК разрешены входящие подключения для Node/Vite (firewall).

## Terminals You Need

- **Terminal A (repo root):** backend server
- **Terminal B (repo root):** frontend dev server (Vite with host)
- **Terminal C (repo root):** device bridge commands (`adb` for Android)
- **Terminal D (repo root):** Capacitor run commands

---

## 1) Android over Wi-Fi (no USB required)

### 1.1 Enable wireless debugging on phone

On phone:
- `Settings -> About phone -> tap Build number 7 times` (enable Developer options)
- `Developer options -> Wireless debugging = ON`

### 1.2 Pair ADB over Wi-Fi (no cable)

On phone in `Wireless debugging`:
- Open `Pair device with pairing code`
- You will see `IP:PAIR_PORT` and a pairing code

On **Terminal C**:

```bash
adb pair <PHONE_IP>:<PAIR_PORT>
```

Enter pairing code from phone.

Then on phone (same screen) find debug endpoint `IP:DEBUG_PORT`, and run:

```bash
adb connect <PHONE_IP>:<DEBUG_PORT>
adb devices
```

Device should appear as `device`.

### 1.3 Start project services

On **Terminal A**:

```bash
npm run dev --workspace=backend
```

On **Terminal B**:

```bash
npm run dev --workspace=frontend -- --host 0.0.0.0 --port 5173
```

### 1.4 Run app on Android device

On **Terminal D**:

```bash
npx cap run android --target <DEVICE_ID> -l --external
```

If needed, explicit host/port:

```bash
npx cap run android --target <DEVICE_ID> -l --host=<PC_LAN_IP> --port=5173
```

---

## 2) iOS over Wi-Fi (important limitation)

### 2.1 Reality check

Полностью "без первичной связки" для direct debug через Xcode обычно недоступно:
- для запуска debug build на физическом iPhone нужна initial trust/signing setup через Xcode (обычно с кабелем хотя бы один раз).

### 2.2 Wi-Fi-only practical variants

#### Variant A: Test web/PWA flow over Wi-Fi (no cable, no Xcode run)

Works without primary USB pairing.

On **Terminal A**:

```bash
npm run dev --workspace=backend
```

On **Terminal B**:

```bash
npm run dev --workspace=frontend -- --host 0.0.0.0 --port 5173
```

On iPhone Safari open:

```text
http://<PC_LAN_IP>:5173
```

Use "Add to Home Screen" for PWA-like behavior.

#### Variant B: Native iOS build without cable via remote distribution

If you must test native behavior without any local cable pairing:
- build iOS app in CI (or Mac build host),
- distribute via TestFlight,
- install on device from TestFlight.

This is not a local live-reload debug loop, but it is fully cable-free.

---

## 3) Common Troubleshooting

- Device cannot open `http://<PC_LAN_IP>:5173`:
  - check PC and phone are in same subnet,
  - disable VPN/proxy,
  - allow Node/Vite in firewall.
- `adb devices` empty:
  - repeat `adb pair` and `adb connect`,
  - ensure Wireless debugging still enabled.
- Capacitor runs but app cannot hit backend:
  - verify backend bound and reachable from phone,
  - use LAN URL in env (`VITE_API_URL`, `VITE_WS_URL`) if required.

---

## 4) Recommended Daily Flow

1. Start DB (`docker-compose up -d`)
2. Start backend (Terminal A)
3. Start frontend with `--host 0.0.0.0` (Terminal B)
4. Connect device over Wi-Fi (Terminal C for Android)
5. Run Capacitor (Terminal D) or open PWA URL on phone
