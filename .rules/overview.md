# Beat Marketplace Platform -- Final Year Project

## Project Overview

This project is a full-stack web application that allows music producers
to upload, showcase, and sell beats, while buyers can browse, preview,
and purchase beats.

The platform will function similarly to online beat marketplaces such as
BeatStars or Beat22.

The system will be built using the MERN stack with a separated frontend
and backend architecture.

------------------------------------------------------------------------

# Tech Stack

## Frontend

-   React
-   TypeScript
-   Tailwind CSS
-   Axios
-   Wavesurfer.js (audio waveform player)

## Backend

-   Node.js
-   Express.js
-   TypeScript

## Database

-   MongoDB (connection string via environment variables)

## Storage

-   Cloudinary (audio files and cover images)

## Authentication

-   JWT Access Tokens
-   JWT Refresh Tokens

## Email Services

-   Nodemailer OR Resend API

------------------------------------------------------------------------

# Architecture

The application will follow a **client-server architecture**.

    root
    │
    ├── client  (React Frontend)
    │
    └── server  (Node.js Backend)

Frontend and backend will be developed independently.

------------------------------------------------------------------------

# Core Features

## Buyer Features

-   Browse beats
-   Search beats by genre, BPM, tags
-   Preview beats using waveform player
-   Buy beat licenses
-   Create user account
-   Save favorite beats

## Producer Features

-   Create producer profile
-   Upload beats
-   Set beat price
-   Manage beat licenses
-   Track beat sales

------------------------------------------------------------------------

# Landing Page (Current Development Goal)

The first development phase is **building the landing page**.

### Landing Page Sections

1.  Navbar
2.  Hero Section
3.  Trending Beats
4.  Featured Producers
5.  Beat Categories
6.  How It Works
7.  Testimonials
8.  Call To Action
9.  Footer

------------------------------------------------------------------------

# UI Design System

The platform will use a **dark music marketplace theme**.

## Color Palette

Primary Background

    #0B0B0B

Secondary Background

    #121212

Card Hover Background

    #1A1A1A

Primary Accent

    #1ED760

Primary Hover

    #22FFA3

Accent Highlight

    #7C5CFF

Primary Text

    #FFFFFF

Secondary Text

    #B3B3B3

Muted Text

    #6B7280

Borders

    #262626

Dividers

    #2A2A2A

------------------------------------------------------------------------

# Tailwind Theme Configuration

Example configuration for Tailwind:

``` ts
theme: {
  extend: {
    colors: {
      bg: "#0B0B0B",
      card: "#121212",
      cardHover: "#1A1A1A",
      primary: "#1ED760",
      primaryHover: "#22FFA3",
      accent: "#7C5CFF",
      textPrimary: "#FFFFFF",
      textSecondary: "#B3B3B3",
      textMuted: "#6B7280",
      borderColor: "#262626",
      divider: "#2A2A2A"
    }
  }
}
```

------------------------------------------------------------------------

# Database Design

## Collections

    users
    beats
    licenses
    orders
    producers
    reviews

## Beat Schema (Example)

    title
    producerId
    genre
    bpm
    key
    price
    audioUrl
    coverImage
    licenseTypes
    createdAt

------------------------------------------------------------------------

# Important UI Components

-   Navbar
-   Hero Section
-   BeatCard
-   ProducerCard
-   CategoryCard
-   Testimonials
-   Footer
-   Audio Player (Waveform)

------------------------------------------------------------------------

# Waveform Audio Player

Library:

    wavesurfer.js

Purpose:

-   Beat preview before purchase
-   Professional marketplace UI

------------------------------------------------------------------------

# Authentication Flow

The system will use **JWT-based authentication**.

### Access Token

-   Short-lived
-   Used for API requests

### Refresh Token

-   Stored securely
-   Used to generate new access tokens

------------------------------------------------------------------------

# Environment Variables

Example `.env` configuration:

    MONGODB_URI=your_connection_string
    JWT_ACCESS_SECRET=your_secret
    JWT_REFRESH_SECRET=your_secret
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    EMAIL_PROVIDER_API_KEY=your_email_service_key

------------------------------------------------------------------------

# Future Features

-   Payment integration (Stripe or Razorpay)
-   Beat licensing system
-   Producer dashboards
-   Sales analytics
-   Playlist / favorites
-   Advanced search filters

------------------------------------------------------------------------

# Project Goal

Build a modern beat marketplace platform where producers can sell beats
and buyers can easily discover and purchase music.

This project demonstrates:

-   Full-stack MERN development
-   Authentication systems
-   Cloud storage integration
-   Scalable backend architecture
-   Modern UI design
