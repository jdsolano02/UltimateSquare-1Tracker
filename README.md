# Square-1 Core Engine

A high-performance, local-first analytical dashboard designed for competitive Square-1 speedcubers. Built with Clean Architecture principles, this engine processes session data, provides real-time WCA-compliant statistics, and tracks daily biométric performance to optimize training efficiency.

## 🚀 Features

- **WCA-Compliant Analytics**: Real-time calculation of Mo3, Ao5, Ao12, and global averages using standard trimming rules (WCA 9f2).
- **Daily Performance Tracker**: A specialized module to log biometric data (sleep quality, mental energy, physical fatigue) and correlate it with cubing performance.
- **OBL/CSP Audit Engine**: Dynamic case tracking system to identify bottleneck patterns in OBL and CSP execution.
- **Local-First Architecture**: Powered by `Dexie.js` and `IndexedDB` for zero-latency data persistence without the need for external cloud backends.
- **Data Visualization**: Interactive performance charts using `Recharts` for Gaussian distribution and time-series progress tracking.

## 🛠 Technical Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS (v4)
- **Database**: IndexedDB via Dexie.js
- **Data Processing**: PapaParse (CSV integration)
- **Mathematical Engine**: Custom TypeScript implementation of WCA standard deviations and sliding window averages.

## 📦 Getting Started

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
2. Install dependencies: npm install
3. Run the development server: npm run dev

📐 Architecture
The project follows the Clean Architecture pattern to ensure strict separation of concerns:

domain/: Business entities and interfaces.
application/: Pure logic and use cases (statistical engine).
infrastructure/: Data persistence (Dexie) and external parsers.
presentation/: React components and custom hooks.

📝 License
This project is licensed under the MIT License.