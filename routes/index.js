var express = require("express");
var router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const excel = require("exceljs");

router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/adduser", async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        mobile: parseInt(req.body.mobile)
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getuser", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.render("getuser", { users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal server error");
  }
});

router.post("/addtask", async (req, res) => {
  const { user, taskName, taskType } = req.body;

  try {
    const createdTask = await prisma.task.create({
      data: {
        taskName,
        taskType,
        status: taskType === "Done",
        user: { connect: { id: parseInt(user) } },
      },
    });

    res.status(201).send("Task added successfully");
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).send("Internal server error");
  }
});

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: { user: true },
    });
    res.render("userdetails", { tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).send("Internal server error");
  }
});

router.get("/excel", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { tasks: true }
    });

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Users and Tasks");

    worksheet.addRow(["User ID", "Name", "Email", "Mobile", "Task ID", "Task Name", "Task Status"]);

    users.forEach(user => {
      user.tasks.forEach(task => {
        worksheet.addRow([user.id, user.name, user.email, user.mobile, task.id, task.taskName, task.taskType]);
      });
    });

    const filePath = "users_and_tasks.xlsx";
    await workbook.xlsx.writeFile(filePath);

    console.log("Excel file generated successfully");
    res.download(filePath);
  } catch (error) {
    console.error("Error generating Excel file:", error);
    res.status(500).send("Error generating Excel file");
  }
});

module.exports = router;
