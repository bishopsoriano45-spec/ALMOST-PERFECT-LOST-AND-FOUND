<div align="center">

# 🔍 Lost & Found AI System

[![React](https://img.shields.io/badge/React-19.0%2B-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.0%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0%2B-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A comprehensive **Lost & Found AI System** designed to streamline the recovery of lost items. This AI-powered platform provides intuitive interfaces for users to report and find items, while equipping administrators with robust claims management and object detection tools to ensure accurate and secure item returns.

</div>

## Project Overview

**Lost & Found AI System** is a robust web application built with React, Vite, Node.js, and PostgreSQL. It addresses the common challenge of recovering lost assets by leveraging advanced machine learning to facilitate item matching and centralized management.

The system enforces a seamless reporting process for users, utilizing YOLOv8m and other AI tools to analyze item images for accurate categorization, while administrators oversee claims, track statuses, and resolve matches in a comprehensive admin dashboard.

## Key Features

### <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/bot.svg" width="35" style="vertical-align: middle;"> AI Object Detection & Smart Matching
- **Smart Categorization**: Extrapolates attributes from user uploads using AI (YOLOv8m) to automate the classification process.
- **Intelligent Matching**: Cross-references reported lost items with found items to suggest potential matches instantly.

### User Access

- **Intuitive Reporting**: Quickly submit lost or found reports with image uploads and specific item details.
- **Search & Filter**: Advanced capabilities for finding specific items across different categories, dates, or locations.
- **Integrated Claims System**: Securely claim a found item directly from the application interface.

### Admin Console

- **Claims Dashboard**: Comprehensive view and filtering of all active item claims.
- **Status Tracking**: Monitor individual claims progression step-by-step.
- **Bulk Actions & Resolutions**: Efficiently approve or reject multiple claims, with automated workflows for mitigating conflicting disputes.
- **Analytics & Management**: Track platform performance metrics and oversee users.

## Quick Start

### <img src="https://skillicons.dev/icons?i=nodejs" alt="Node.js" height="40" style="vertical-align: middle;"> Local Development Environment

1. **Clone the repository**

   ```bash
   git clone https://github.com/frostjade71/ALMOST-PERFECT-LOST-AND-FOUND.git
   cd ALMOST-PERFECT-LOST-AND-FOUND
   ```

2. **Configure Environment**

   Copy `.env.example` to `.env` in both the root and `server/` directories, and configure your database and API credentials:
   ```bash
   cp .env.example .env
   cd server && cp .env.example .env
   ```

3. **Install Dependencies & Start Application**

   Main Application (Frontend):
   ```bash
   pnpm install
   pnpm run dev
   ```

   Backend API (Server):
   ```bash
   cd server
   npm install
   node index.js
   ```

4. **Access the System**
   - **Web Interface**: `http://localhost:5173` (Vite Default)
   - **API Server**: `http://localhost:3000` (Node Default)

## Technology Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,ts,tailwind,nodejs,postgres,supabase,vite" alt="Technology Stack" />
</p>

- **Frontend**: React 19, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js
- **Database**: PostgreSQL / Supabase
- **AI Integration**: YOLOv8m, ONNX Runtime Web
- **Build Tools**: Vite, ESLint, PostCSS

## Configuration

### Database Environment

Ensure you have your environment variables properly set up to connect to your PostgreSQL database. Check `server/.env.example` and `.env.example` for the required keys.

## Usage Guide

1. **Home**: Access statistics overview and navigate to the reporting module.
2. **Report**: Upload a picture and fill out the details for a Lost or Found item.
3. **Claims Management**: Log in with Admin privileges to approve, deny, and resolve item claims.
4. **AI Features**: When uploading an image, wait for the AI object detection model to suggest tags and matches.

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/NewFeature`)
3. Commit your changes (`git commit -m 'Add NewFeature'`)
4. Push to the branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

## License

**Copyright (c) 2026 Bishop Soriano. All Rights Reserved.**

This software is a commissioned work depending on proprietary and confidential information. Permission is hereby granted to the client/student to use this software solely for the purpose of academic requirements and thesis defense.

---
