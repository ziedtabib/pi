const express = require("express");
const cors = require("cors");
const CourseController = require("../controller/CourseController"); // Ensure path is correct

const router = express.Router();
router.use(cors());
router.use(express.json());

// CRUD Routes
router.post("/add", CourseController.add);
router.get("/", CourseController.getAll);
router.get("/getCourse/:id", CourseController.getById);
router.put("/update/:id", CourseController.update);
router.delete("/delete/:id", CourseController.deleteCourse);

// Checkout Routes
router.post("/checkout", CourseController.createCheckout); // Renamed from "/create-checkout" for consistency
router.get("/complete", CourseController.completePayment);
router.get("/cancel", CourseController.cancelPayment);

// Additional Route from CoursRestAPI
router.get("/byTitre", CourseController.getCoursByTitre);

module.exports = router;