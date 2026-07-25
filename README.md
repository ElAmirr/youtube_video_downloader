# TubeFlow - Modern Desktop Video Downloader

TubeFlow is a fast, beautiful, and highly-optimized desktop video downloader powered by `yt-dlp`. It allows you to download videos from YouTube in the absolute highest available quality (including high-bitrate VP9/AV1 codecs natively merged into MKV/MP4 containers).

Built using **Electron**, **React**, **Vite**, and **Tailwind CSS**.

---

## 🚀 Features

- **Highest Quality Downloads:** Automatically fetches the best video and audio streams and merges them losslessly.
- **Modern User Interface:** A sleek, fully responsive interface built with Tailwind CSS.
- **Dynamic Themes:** Instantly switch between an optimized high-contrast **Dark Cyber Theme** and a clean **Light Theme**.
- **Download Queue:** View and manage all your active downloads with real-time progress, speed, and ETA indicators.
- **Customizable Settings:** Set your preferred download directory and max concurrent downloads.
- **Download History:** Keep a persistent record of all your successfully downloaded videos.

---

## 🛠️ Step-by-Step User Guide

### 1. Installation
After downloading or building the app, install it and launch TubeFlow from your Desktop or Start Menu.

### 2. Configure Settings (Optional)
1. Navigate to the **Settings** tab in the sidebar.
2. Under **Storage & Directory**, click **Browse** to select where you want your downloaded videos to be saved. (It defaults to your system Downloads folder).
3. Toggle the **Dark Cyber Theme** switch to instantly change the app's appearance.

### 3. Download a Video
1. Go to the **Home** tab.
2. Paste a YouTube URL into the input bar and press **Enter** (or click Analyze).
3. Wait for the app to analyze the available video formats.
4. Select your preferred resolution from the dropdown menu.
5. Click **Download**.

### 4. Manage Your Queue
1. Navigate to the **Queue** tab to see your active downloads.
2. Here you can monitor download progress, current speed, and estimated time remaining.

### 5. View History
1. Once a video finishes downloading, it will appear in the **History** tab.
2. You can review all your past downloads or clear your history at any time.

---

## 💻 Developer Setup

If you want to clone this repository and run the app locally, follow these steps:

### Prerequisites
- Node.js (v18+)
- npm

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/youtube_video_downloader.git
   cd youtube_video_downloader
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *(This will also automatically download a local instance of FFmpeg for high-quality stream merging)*

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```

4. **Build the Production Application:**
   To build the final Windows setup `.exe` installer:
   ```bash
   npm run build
   ```
   The installer will be generated in the `release/` or `dist/` directory depending on the configuration.

---

## 📜 License

This project is open-source and available under the MIT License.
