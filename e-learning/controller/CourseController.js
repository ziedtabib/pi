require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Course = require("../models/Course");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Ensure this folder exists
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});
const upload = multer({ storage });

// Add a course with image and PDFs
async function add(req, res) {
    upload.fields([
        { name: "image", maxCount: 1 }, // Replaces 'thumb'
        { name: "pdfs", maxCount: 10 }  // For contenu
    ])(req, res, async (err) => {
        if (err) {
            return res.json({ status: "FAILED", message: err.message });
        }

        let { titre, price, description, category, instructors, rating, skill_level, price_type, language, popular } = req.body;
        const image = req.files?.image ? `/uploads/${req.files.image[0].filename}` : "/uploads/default.jpg";
        const contenu = req.files?.pdfs ? req.files.pdfs.map(file => `/uploads/${file.filename}`) : [];

        titre = titre?.trim();
        price = parseFloat(price);
        description = description?.trim();
        category = category?.trim();
        instructors = instructors?.trim();
        rating = rating ? parseFloat(rating) : 0;
        skill_level = skill_level?.trim();
        price_type = price_type?.trim();
        language = language?.trim();
        popular = popular?.trim();

        if (!titre || !price || !description || !category || !instructors || !skill_level || !price_type || !language) {
            return res.json({ status: "FAILED", message: "Required input fields are empty!" });
        }

        if (price < 0) {
            return res.json({ status: "FAILED", message: "Price cannot be negative!" });
        }

        try {
            const existingCourse = await Course.findOne({ titre });
            if (existingCourse) {
                return res.json({ status: "FAILED", message: "Course title already exists" });
            }

            const newCourse = new Course({
                titre,
                price,
                description,
                category,
                instructors,
                rating,
                image,
                skill_level,
                price_type,
                language,
                popular,
                contenu
            });

            const result = await newCourse.save();
            res.json({ status: "SUCCESS", message: "Course added successfully", data: result });
        } catch (error) {
            res.json({ status: "FAILED", message: error.message });
        }
    });
}

// Get all courses
async function getAll(req, res) {
    try {
      const courses = await Course.find().lean();
      console.log('Fetched courses:', courses); // Add this line
      if (!courses || courses.length === 0) {
        return res.status(204).json({ status: "SUCCESS", message: "No courses found", data: [] });
      }
      res.status(200).json({ status: "SUCCESS", message: "Courses retrieved successfully", data: courses });
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ status: "FAILED", message: error.message });
    }
  }

// Get course by ID
async function getById(req, res) {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ status: "FAILED", message: "Invalid Course ID format" });
        }
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ status: "FAILED", message: "Course not found" });
        }
        res.status(200).json({ status: "SUCCESS", message: "Course retrieved successfully", data: course });
    } catch (error) {
        res.status(500).json({ status: "FAILED", message: error.message });
    }
}

// Update a course with image and PDFs
async function update(req, res) {
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "pdfs", maxCount: 10 }
    ])(req, res, async (err) => {
        if (err) {
            return res.json({ status: "FAILED", message: err.message });
        }

        try {
            if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({ status: "FAILED", message: "Invalid Course ID format" });
            }

            let { titre, price, description, category, instructors, rating, skill_level, price_type, language, popular, contenu } = req.body;
            const image = req.files?.image ? `/uploads/${req.files.image[0].filename}` : undefined;
            const newPdfs = req.files?.pdfs ? req.files.pdfs.map(file => `/uploads/${file.filename}`) : [];

            titre = titre?.trim();
            price = price ? parseFloat(price) : undefined;
            description = description?.trim();
            category = category?.trim();
            instructors = instructors?.trim();
            rating = rating ? parseFloat(rating) : undefined;
            skill_level = skill_level?.trim();
            price_type = price_type?.trim();
            language = language?.trim();
            popular = popular?.trim();
            let updatedContenu = contenu ? JSON.parse(contenu) : undefined;

            const course = await Course.findById(req.params.id);
            if (!course) {
                return res.status(404).json({ status: "FAILED", message: "Course not found" });
            }

            if (price && price < 0) {
                return res.json({ status: "FAILED", message: "Price cannot be negative!" });
            }

            updatedContenu = updatedContenu || (course.contenu ? [...course.contenu] : []);
            if (newPdfs.length > 0) {
                updatedContenu.push(...newPdfs);
            }

            const updatedCourse = await Course.findByIdAndUpdate(
                req.params.id,
                {
                    titre,
                    price,
                    description,
                    category,
                    instructors,
                    rating,
                    image: image || course.image,
                    skill_level,
                    price_type,
                    language,
                    popular,
                    contenu: updatedContenu
                },
                { new: true, runValidators: true }
            );

            if (!updatedCourse) {
                return res.status(404).json({ status: "FAILED", message: "Course not found" });
            }
            res.status(200).json({ status: "SUCCESS", message: "Course updated successfully", data: updatedCourse });
        } catch (error) {
            res.status(400).json({ status: "FAILED", message: error.message });
        }
    });
}

// Delete a course
async function deleteCourse(req, res) {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ status: "FAILED", message: "Invalid Course ID format" });
        }
        const deletedCourse = await Course.findByIdAndDelete(req.params.id);
        if (!deletedCourse) {
            return res.status(404).json({ status: "FAILED", message: "Course not found" });
        }
        res.status(200).json({ status: "SUCCESS", message: "Course deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: "FAILED", message: error.message });
    }
}

// Create checkout session
async function createCheckout(req, res) {
    try {
        const { courses } = req.body;
        if (!courses || courses.length === 0) {
            return res.json({ status: "FAILED", message: "No courses selected for checkout" });
        }

        const line_items = courses.map((course) => ({
            price_data: {
                currency: "usd",
                product_data: { name: course.titre, description: course.description }, // Updated 'title' to 'titre'
                unit_amount: Math.round(course.price * 100),
            },
            quantity: course.quantity || 1,
        }));

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: "payment",
            shipping_address_collection: { allowed_countries: ["US", "BR"] },
            success_url: `${process.env.BASE_URL}/course/complete?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/course/cancel`,
        });

        res.json({ status: "SUCCESS", url: session.url });
    } catch (error) {
        console.error("Checkout error:", error);
        res.status(500).json({ status: "FAILED", message: error.message });
    }
}

// Complete payment
async function completePayment(req, res) {
    try {
        const [session, lineItems] = await Promise.all([
            stripe.checkout.sessions.retrieve(req.query.session_id, { expand: ["payment_intent.payment_method"] }),
            stripe.checkout.sessions.listLineItems(req.query.session_id),
        ]);

        if (session.payment_status === "paid") {
            const testPhoneNumber = "+21699516931"; // Replace with your number
            const twilioFromNumber = process.env.TWILIO_PHONE_NUMBER;

            console.log("Sending SMS with:", { from: twilioFromNumber, to: testPhoneNumber });
            // Assuming Twilio is set up (not included in your original code)
            // await twilio.messages.create({...});

            res.json({
                status: "SUCCESS",
                message: "Your payment was successful",
                data: { session, lineItems },
            });
        }
    } catch (error) {
        console.error("Payment completion error:", error);
        res.status(500).json({ status: "FAILED", message: error.message });
    }
}

// Cancel payment
async function cancelPayment(req, res) {
    res.json({ status: "CANCELLED", message: "Payment cancelled" });
}

// Get course by title
async function getCoursByTitre(req, res) {
    try {
        const titre = req.query.titre?.trim();
        if (!titre) {
            return res.status(400).json({ status: "FAILED", message: "Title parameter is required" });
        }
        const course = await Course.findOne({ titre });
        if (!course) {
            return res.status(404).json({ status: "FAILED", message: "Course not found" });
        }
        res.status(200).json({ status: "SUCCESS", message: "Course retrieved successfully", data: course });
    } catch (error) {
        res.status(500).json({ status: "FAILED", message: error.message });
    }
}

module.exports = {
    add,
    getAll,
    getById,
    update,
    deleteCourse,
    createCheckout,
    completePayment,
    cancelPayment,
    getCoursByTitre
};