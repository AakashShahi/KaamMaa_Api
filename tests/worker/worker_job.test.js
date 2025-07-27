const request = require("supertest");
const app = require("../../index");
const mongoose = require("mongoose");
const User = require("../../models/User");
const Job = require("../../models/Job");
const Profession = require("../../models/ProfessionCategory");
const Notification = require("../../models/Notification");

let customerToken, workerToken, otherWorkerToken;
let customerId, workerId, otherWorkerId;
let professionId;
let openJobId, assignedToWorkerJobId, requestedByOtherWorkerJobId, completedJobId;

const getFutureDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

beforeAll(async () => {
    // Clean the database
    await User.deleteMany({});
    await Job.deleteMany({});
    await Profession.deleteMany({});
    await Notification.deleteMany({});

    // 1. CREATE USERS VIA API
    await request(app).post("/api/auth/register").send({ username: 'jobCustomer', name: 'Job Customer', email: 'job.customer@test.com', password: 'password123', role: 'customer', phone: '9822222201' });
    await request(app).post("/api/auth/register").send({ username: 'jobWorker', name: 'Job Worker', email: 'job.worker@test.com', password: 'password123', role: 'worker', phone: '9822222202' });
    await request(app).post("/api/auth/register").send({ username: 'otherJobWorker', name: 'Other Job Worker', email: 'other.job.worker@test.com', password: 'password123', role: 'worker', phone: '9822222203' });

    // Fetch users to get IDs
    const customerUser = await User.findOne({ email: 'job.customer@test.com' });
    const workerUser = await User.findOne({ email: 'job.worker@test.com' });
    const otherWorkerUser = await User.findOne({ email: 'other.job.worker@test.com' });

    customerId = customerUser._id;
    workerId = workerUser._id;
    otherWorkerId = otherWorkerUser._id;

    // 2. LOG IN USERS
    const customerLoginRes = await request(app).post("/api/auth/login").send({ email: "job.customer@test.com", password: "password123" });
    customerToken = customerLoginRes.body.token;
    const workerLoginRes = await request(app).post("/api/auth/login").send({ email: "job.worker@test.com", password: "password123" });
    workerToken = workerLoginRes.body.token;
    const otherWorkerLoginRes = await request(app).post("/api/auth/login").send({ email: "other.job.worker@test.com", password: "password123" });
    otherWorkerToken = otherWorkerLoginRes.body.token;

    // 3. CREATE DATA
    const prof = await Profession.create({ name: 'Carpentry', category: 'carpentry', description: 'Woodworking' });
    professionId = prof._id;

    openJobId = (await Job.create({ postedBy: customerId, category: professionId, description: 'Build a new bookshelf', location: 'Living Room', date: getFutureDate(5), time: '10:00', status: 'open' }))._id;
    assignedToWorkerJobId = (await Job.create({ postedBy: customerId, category: professionId, assignedTo: workerId, description: 'Repair kitchen cabinet', location: 'Kitchen', date: getFutureDate(6), time: '11:00', status: 'assigned' }))._id;
    requestedByOtherWorkerJobId = (await Job.create({ postedBy: customerId, category: professionId, assignedTo: otherWorkerId, description: 'Fix wobbly chair', location: 'Dining Room', date: getFutureDate(7), time: '12:00', status: 'requested' }))._id;
    completedJobId = (await Job.create({ postedBy: customerId, category: professionId, assignedTo: workerId, description: 'Assemble a table', location: 'Office', date: getFutureDate(1), time: '14:00', status: 'done' }))._id;
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("Worker Job Controller - /api/worker/jobs", () => {

    // --- GET /public ---
    describe("GET /public (getPublicJobs)", () => {
        test("✅ [SUCCESS] Worker should get available public jobs", async () => {
            const res = await request(app)
                .get("/api/worker/jobs/public")
                .set("Authorization", `Bearer ${workerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body.data.some(job => job.status === 'open')).toBe(true);
        });

        test("✅ [SUCCESS] Worker should get filtered jobs by category", async () => {
            const res = await request(app)
                .get("/api/worker/jobs/public?category=Carpentry")
                .set("Authorization", `Bearer ${workerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.every(job => job.category.name === 'Carpentry')).toBe(true);
        });

        test("❌ [AUTH] Customer should not get public jobs via worker route", async () => {
            const res = await request(app)
                .get("/api/worker/jobs/public")
                .set("Authorization", `Bearer ${customerToken}`);
            expect(res.statusCode).toBe(403);
        });
    });

    // --- POST /public/:jobId/accept ---
    describe("POST /public/:jobId/accept (acceptPublicJob)", () => {
        test("✅ [SUCCESS] Worker should be able to request an open job", async () => {
            const res = await request(app)
                .post(`/api/worker/jobs/public/${openJobId}/accept`)
                .set("Authorization", `Bearer ${workerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe("Job request sent. Awaiting customer approval.");
            const job = await Job.findById(openJobId);
            expect(job.status).toBe("requested");
            expect(job.assignedTo.toString()).toBe(workerId.toString());
            // Check for notification
            const notification = await Notification.findOne({ userId: customerId });
            expect(notification).toBeDefined();
            expect(notification.title).toBe("New Job Request");
        });

        test("❌ [FAIL] Should not be able to request an already requested job", async () => {
            const res = await request(app)
                .post(`/api/worker/jobs/public/${openJobId}/accept`)
                .set("Authorization", `Bearer ${otherWorkerToken}`);
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe("Job is not available for acceptance.");
        });
    });

    // --- PATCH /requested/cancel/:jobId ---
    describe("PATCH /requested/cancel/:jobId (cancelRequestedJob)", () => {
        test("✅ [SUCCESS] Worker should be able to cancel their own job request", async () => {
            // First, the other worker requests a job
            const newOpenJob = await Job.create({ postedBy: customerId, category: professionId, description: 'New job to be cancelled', location: 'Garage', date: getFutureDate(8), time: '09:00', status: 'open' });
            await request(app).post(`/api/worker/jobs/public/${newOpenJob._id}/accept`).set("Authorization", `Bearer ${otherWorkerToken}`);

            const res = await request(app)
                .patch(`/api/worker/jobs/requested/cancel/${newOpenJob._id}`)
                .set("Authorization", `Bearer ${otherWorkerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe("Job request cancelled successfully");
            const job = await Job.findById(newOpenJob._id);
            expect(job.status).toBe("open");
            expect(job.assignedTo).toBeNull();
        });

        test("❌ [AUTH] Worker should not be able to cancel another worker's request", async () => {
            const res = await request(app)
                .patch(`/api/worker/jobs/requested/cancel/${requestedByOtherWorkerJobId}`)
                .set("Authorization", `Bearer ${workerToken}`);
            expect(res.statusCode).toBe(403);
        });
    });

    // --- GET /assigned ---
    describe("GET /assigned (getAssignedJobs)", () => {
        test("✅ [SUCCESS] Worker should get their assigned jobs", async () => {
            const res = await request(app)
                .get("/api/worker/jobs/assigned")
                .set("Authorization", `Bearer ${workerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0]._id.toString()).toBe(assignedToWorkerJobId.toString());
        });
    });

    // --- PUT /assigned/:jobId/accept ---
    describe("PUT /assigned/:jobId/accept (acceptAssignedJob)", () => {
        test("✅ [SUCCESS] Worker should accept a manually assigned job", async () => {
            const res = await request(app)
                .put(`/api/worker/jobs/assigned/${assignedToWorkerJobId}/accept`)
                .set("Authorization", `Bearer ${workerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe("Job accepted and now in progress");
            const job = await Job.findById(assignedToWorkerJobId);
            expect(job.status).toBe("in-progress");
        });

        test("❌ [FAIL] Should not accept a job that is not in 'assigned' status", async () => {
            const res = await request(app)
                .put(`/api/worker/jobs/assigned/${completedJobId}/accept`)
                .set("Authorization", `Bearer ${workerToken}`);
            expect(res.statusCode).toBe(400);
        });
    });

    // --- PUT /assigned/:jobId/reject ---
    describe("PUT /assigned/:jobId/reject (rejectAssignedJob)", () => {
        test("✅ [SUCCESS] Worker should be able to reject an assigned job", async () => {
            // Create a new job to be rejected
            const rejectableJobId = (await Job.create({ postedBy: customerId, category: professionId, assignedTo: workerId, description: 'Reject this job', location: 'Patio', date: getFutureDate(9), time: '16:00', status: 'assigned' }))._id;

            const res = await request(app)
                .put(`/api/worker/jobs/assigned/${rejectableJobId}/reject`)
                .set("Authorization", `Bearer ${workerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe("Job rejected");

            const job = await Job.findById(rejectableJobId);
            expect(job.status).toBe("open");
            expect(job.assignedTo).toBeNull();
        });
    });

    // --- GET /completed ---
    describe("GET /completed (getCompletedJobs)", () => {
        test("✅ [SUCCESS] Worker should get their completed jobs", async () => {
            const res = await request(app)
                .get("/api/worker/jobs/completed")
                .set("Authorization", `Bearer ${workerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0]._id.toString()).toBe(completedJobId.toString());
        });
    });

});