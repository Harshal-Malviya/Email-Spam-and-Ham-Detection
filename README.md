# 📧 Email Spam and Ham Detection System

A full‑stack Machine Learning web application that classifies emails/messages as **Spam** or **Ham (Not Spam)** using Natural Language Processing and a trained ML model. This project includes a **Flask backend** and a **React frontend** with a clean, modern UI.

---

## 🚀 Features

- ✅ Classifies messages into **Spam** or **Ham**
- ✅ High‑accuracy ML model using **TF‑IDF + Scikit‑learn**
- ✅ Flask REST API for predictions
- ✅ Interactive React frontend
- ✅ Ready for deployment
- ✅ Secured file handling via `.gitignore`

---

## 🧠 Tech Stack

### Backend

- Python
- Flask
- Scikit‑Learn
- NLTK
- Pandas / NumPy
- Joblib

### Frontend

- React.js
- HTML / CSS / JS

---

## 📂 Project Structure

EMAIL SPAM AND HAM DETECTION │ ├── backend/ │   ├── app.py │   ├── spam\_classifier.pkl │   ├── tfidf\_vectorizer.pkl │   ├── token.pickle │   ├── client\_secret.json │   ├── credentials.json │   ├── message.json │   ├── package.json │   └── package-lock.json │ ├── frontend/ │   ├── public/ │   └── src/ │       ├── components/ │       ├── styles/ │       ├── views/ │       ├── utils/ │       ├── App.js │       └── index.js │ ├── .gitignore ├── requirements.txt └── README.md

---

## ⚙️ How to Run the Project

### 1️⃣ Clone the repository

```bash
git clone https://github.com/Harshal-Malviya/Email-Spam-and-Ham-Detection.git
cd Email-Spam-and-Ham-Detection
```

---

### 2️⃣ Backend Setup (Flask)

```bash
cd backend
pip install -r ../requirements.txt
python app.py
```

Server runs on:

```
http://127.0.0.1:5000
```

---

### 3️⃣ Frontend Setup (React)

```bash
cd frontend
npm install
npm start
```

Frontend runs on:

```
http://localhost:3000
```

---

## 📡 API Endpoint

**POST /predict**

Request:

```json
{
   "message": "Congratulations, you won a prize!"
}
```

Response:

```json
{
   "prediction": "Spam"
}
```

---

## 📈 Model Details

- Algorithm: Logistic Regression / Naive Bayes (depending on your training)
- Vectorizer: TF‑IDF
- Preprocessing: Tokenization, stopword removal, stemming

---

## 🔐 Security Note

The included credential files are **ONLY for testing/demo purposes** and **do not contain personal information**. In production, they should be replaced using environment variables or `.env` files.

---

## 🌍 Future Enhancements

- JWT Authentication
- Email inbox integration
- Multi‑language spam detection
- Admin dashboard for monitoring

---

## 👑 Developer

**Harshal Malviya**

- GitHub: [https://github.com/Harshal-Malviya](https://github.com/Harshal-Malviya)
- Field: AI & Data Science

---

🔥 *A production‑ready Machine Learning project built for impact, scalability, and real‑world use.*

