# The Pirate Bay - Full-Stack Web Application Clone

![Project Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Technologies](https://img.shields.io/badge/tech-MERN%20Stack-purple)

A comprehensive, feature-rich clone of The Pirate Bay, built from the ground up using modern web technologies. This project was developed as part of the Web Programming course (CSE 2022) and serves as a complete demonstration of a full-stack MERN-like application, from user authentication and file sharing to a dynamic community forum.

![The Pirate Bay Clone Homepage](https://github.com/UnityNimit/pirate_bay/blob/main/frontend/public/images/main.png)

---

## ✨ Core Features

This isn't just a static replica; it's a living, data-driven application with a complete backend API and a dynamic frontend.

###  Torrent & File Sharing
- **End-to-End Upload/Download:** Users can create their own `.torrent` files, upload them to the platform, and other users can download them via fully functional **Magnet Links** compatible with any BitTorrent client (e.g., uTorrent, qBittorrent).
- **Intelligent Torrent Parsing:** The backend automatically parses uploaded `.torrent` files to extract the true **InfoHash**, file list, size, and name, ensuring data integrity.
- **Dynamic Search & Filtering:** A powerful search engine that allows users to find torrents by name and filter by multiple categories.
- **"I'm Feeling Lucky" Button:** Instantly navigates to the detail page of the most-seeded torrent matching a search query.
- **Top 100 Page:** Dynamically generated lists of the top-seeded torrents across various categories.
- **Tracker Simulation:** Download counts and peer statistics are updated in real-time when a user initiates a download.

### 👤 User & Social Features
- **Secure Authentication:** Complete user registration and login system using **JWT (JSON Web Tokens)** for secure, stateless sessions. Passwords are securely hashed with `bcrypt`.
- **Rich User Profiles:** Every user has a public profile page displaying their statistics, uploads, and forum activity.
- **Avatar Uploads:** Users can upload and change their own profile pictures.
- **Follow/Unfollow System:** Users can follow their favorite uploaders.
- **Torrent Bookmarking:** Users can bookmark torrents for easy access later from their profile.
- **Dynamic UI:** The entire site's navigation and UI dynamically change based on the user's login status.

### 💬 Community Forum
- **Complete Forum System:** A fully functional forum with categories, threads, and posts.
- **Dynamic Thread & Post Creation:** Logged-in users can create new threads and post replies.
- **Pagination:** Thread pages are fully paginated to handle long discussions efficiently.
- **Simple Rich Text Editor:** A "What You See Is What You Get" (WYSIWYG) like editor for posting replies with Bold, Italic, and Quote formatting using BBCode.

---

## 🛠️ Technology Stack & Architecture

This project follows a modern, separated architecture, with a backend API serving a dynamic frontend.

- **Backend:** **Node.js** with **Express.js** for the RESTful API.
- **Database:** **MongoDB** (with Mongoose ODM) for flexible, scalable data storage.
- **Frontend:** Vanilla **HTML5, CSS3, and JavaScript (ES6+)** using the `fetch` API for all client-server communication.
- **Authentication:** **JSON Web Tokens (JWT)** for secure, stateless user sessions.
- **File Handling:** **Multer** for managing file uploads on the backend.
- **Development:** **Nodemon** for live server reloading and a custom Python script for database seeding.

---

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

- **Node.js & npm:** [Download Here](https://nodejs.org/)
- **Git:** [Download Here](https://git-scm.com/)
- **Python:** (Required for the seeding script) [Download Here](https://www.python.org/)
- A **MongoDB Atlas** account for the database.

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/pirate-bay-clone.git
    cd pirate-bay-clone
    ```

2.  **Install Backend Dependencies:**
    ```sh
    cd backend
    npm install
    ```

3.  **Configure Environment Variables:**
    - In the `backend` folder, create a new file named `.env`.
    - Go to your MongoDB Atlas dashboard, click "Connect", choose "Connect your application", and copy your connection string.
    - Add the following to your `.env` file, replacing the placeholder with your string and adding your database name (`piratebay`):
      ```
      MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/piratebay?retryWrites=true&w=majority
      JWT_SECRET=averylongandsupersecretstringthatisrandom12345
      ```

4.  **(Optional but Recommended) Seed the Database:**
    - Install Python dependencies:
      ```sh
      pip install pymongo faker bcrypt
      ```
    - In `backend/scripts/seed_data.py`, replace the placeholder `MONGO_URI` with your connection string.
    - Run the script from the `backend` folder:
      ```sh
      python ./scripts/seed_data.py
      ```
    - You can now log in with: **Email:** `test@test.com` | **Password:** `password`

5.  **Start the Server:**
    - From the `backend` folder, run:
      ```sh
      npm start
      ```
    - The server will start on `http://localhost:5000`.

6.  **View the Application:**
    - Open your browser and navigate to **`http://localhost:5000`**.

---

## 🔮 Future Roadmap (Upcoming Features)

This project has a strong foundation for even more advanced features.

- [ ] **Advanced Search:** Implement full-text search and sorting options (by size, date, seeders).
- [ ] **Real-time Seeder/Leecher Counts:** Integrate a proper BitTorrent tracker library (like `bittorrent-tracker`) to report live peer counts instead of simulating them.
- [ ] **User Roles:** Introduce roles like "Moderator" and "VIP" with special permissions.
- [ ] **Private Messaging System:** Allow users to send private messages to each other.
- [ ] **Torrent Comments:** Implement a commenting system on the torrent detail pages.
- [ ] **Frontend Framework Migration:** Refactor the vanilla JS frontend into a modern framework like **React** or **Vue.js** for enhanced component-based architecture.


---

## 📚 Course Details

- **Course:** Web Programming (CSE 2024)
- **Batch:** 2024, 3rd Semester
- **Academic Year:** 2025-26
- **Faculty:** Dr. Kiran Khatter, Mr. Sachin Wariyal, Mr. Navyum

---

## 👥 Authors

- Nimit Hacker
- Sejal
- TorrentMaster