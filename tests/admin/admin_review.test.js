const request = require("supertest");
const app = require("../../index"); // Import your main Express app
const mongoose = require("mongoose");
const User = require("../../models/User");
const Job = require("../../models/Job");
const Profession = require("../../models/ProfessionCategory");
const Review = require("../../models/Review");

// Store tokens and IDs to use across different tests
let adminToken, customerToken, workerToken;
let customerId, workerId;
let jobId;
let reviewId1, reviewId2;

beforeAll(async () => {
    // Ensure a clean database before tests run
    await User.deleteMany({});
    await Job.deleteMany({});
    await Profession.deleteMany({});
    await Review.deleteMany({});

    // 1. CREATE USERS (ADMIN, CUSTOMER, WORKER)
    // Admin User
    await request(app).post("/api/auth/register").send({
        username: "adminreviewtest",
        name: "Admin Review Test",
        email: "admin.review@test.com",
        password: "password123",
        role: "customer",
        phone: "9800000011"
    });
    await User.updateOne({ email: "admin.review@test.com" }, { $set: { role: "admin" } });

    // Customer User
    await request(app).post("/api/auth/register").send({
        username: "customerreviewtest",
        name: "Customer Review Test",
        email: "customer.review@test.com",
        password: "password123",
        role: "customer",
        phone: "9800000012"
    });
    const customerUser = await User.findOne({ email: "customer.review@test.com" });
    customerId = customerUser._id;

    // Worker User
    await request(app).post("/api/auth/register").send({
        username: "workerreviewtest",
        name: "Worker Review Test",
        email: "worker.review@test.com",
        password: "password123",
        role: "worker",
        phone: "9800000013"
    });
    const workerUser = await User.findOne({ email: "worker.review@test.com" });
    workerId = workerUser._id;

    // 2. LOG IN USERS TO GET JWT TOKENS
    const adminLoginRes = await request(app).post("/api/auth/login").send({ email: "admin.review@test.com", password: "password123" });
    adminToken = adminLoginRes.body.token;

    const customerLoginRes = await request(app).post("/api/auth/login").send({ email: "customer.review@test.com", password: "password123" });
    customerToken = customerLoginRes.body.token;

    const workerLoginRes = await request(app).post("/api/auth/login").send({ email: "worker.review@test.com", password: "password123" });
    workerToken = workerLoginRes.body.token;

    // 3. CREATE PREREQUISITE DATA (PROFESSION, JOB, AND REVIEWS)
    const profession = await Profession.create({
        name: "Review Testing Profession",
        category: "review-testing",
        description: "A profession for testing reviews"
    });

    const job = await Job.create({
        title: "Job for Review",
        description: "A test job to be reviewed.",
        location: "Test Location",
        postedBy: customerId,
        assignedTo: workerId,
        category: profession._id,
        date: new Date(),
        time: "10:00",
        status: "done"
    });
    jobId = job._id;

    // Create reviews directly in the database for testing
    const review1 = await Review.create({
        jobId: jobId,
        workerId: workerId,
        customerId: customerId,
        rating: 5,
        comment: "Excellent work!"
    });
    reviewId1 = review1._id;

    const review2 = await Review.create({
        jobId: jobId,
        workerId: workerId,
        customerId: customerId,
        rating: 4,
        comment: "Very good service."
    });
    reviewId2 = review2._id;
});

afterAll(async () => {
    // Clean up all test data from the database
    await User.deleteMany({});
    await Job.deleteMany({});
    await Profession.deleteMany({});
    await Review.deleteMany({});
    await mongoose.disconnect();
});

describe("Admin Review Routes - /api/admin/review", () => {

    // ------------------------------------------
    // TEST SUITE FOR GET / (getAllReviewsForAdmin)
    // ------------------------------------------
    describe("GET /", () => {
        test("✅ [SUCCESS] Admin should get all reviews", async () => {
            const res = await request(app)
                .get("/api/admin/review")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            // expect(res.body.message).toBe("Reviews fetched successfully"); // This line was removed as the API doesn't return a message
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBe(2);
            // Sorting might not be guaranteed, so check for one of the reviews
            const reviewRatings = res.body.data.map(r => r.rating);
            expect(reviewRatings).toContain(5);
            expect(reviewRatings).toContain(4);
            // Check population
            expect(res.body.data[0].workerId).toHaveProperty("name", "Worker Review Test");
            expect(res.body.data[0].customerId).toHaveProperty("name", "Customer Review Test");
        });

        test("❌ [AUTH] Customer should be forbidden from getting all reviews", async () => {
            const res = await request(app)
                .get("/api/admin/review")
                .set("Authorization", `Bearer ${customerToken}`);

            expect(res.statusCode).toBe(403);
        });

        test("❌ [AUTH] Worker should be forbidden from getting all reviews", async () => {
            const res = await request(app)
                .get("/api/admin/review")
                .set("Authorization", `Bearer ${workerToken}`);

            expect(res.statusCode).toBe(403);
        });

        test("❌ [AUTH] Should fail without an authentication token", async () => {
            const res = await request(app).get("/api/admin/review");
            expect(res.statusCode).toBe(401);
        });
    });

    // ----------------------------------------------------
    // TEST SUITE FOR DELETE /delete/:reviewId (deleteReviewByAdmin)
    // ----------------------------------------------------
    describe("DELETE /delete/:reviewId", () => {
        test("✅ [SUCCESS] Admin should delete a single review by ID", async () => {
            const res = await request(app)
                .delete(`/api/admin/review/delete/${reviewId1}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Review permanently deleted."); // Corrected message

            // Verify the review is no longer in the database
            const deletedReview = await Review.findById(reviewId1);
            expect(deletedReview).toBeNull();
        });

        test("❌ [NOT FOUND] Should return 404 for a non-existent review ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .delete(`/api/admin/review/delete/${nonExistentId}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Review not found");
        });

        test("❌ [SERVER ERROR] Should return 500 for a malformed review ID", async () => {
            const res = await request(app)
                .delete("/api/admin/review/delete/invalid-id")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(500);
            expect(res.body.success).toBe(false);
        });

        test("❌ [AUTH] Customer should be forbidden from deleting a review", async () => {
            const res = await request(app)
                .delete(`/api/admin/review/delete/${reviewId2}`)
                .set("Authorization", `Bearer ${customerToken}`);

            expect(res.statusCode).toBe(403);

            // Verify the review was NOT deleted
            const review = await Review.findById(reviewId2);
            expect(review).not.toBeNull();
        });
    });
});
