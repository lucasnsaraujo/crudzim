import express from "express";
import { v4 as uuid } from "uuid";

const app = express();

const customers = [];

app.use(express.json());

function verifyIfAccountExists(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!!customer) {
    req.customer = customer;
    next();
  } else {
    return res.status(404).json({ error: "User not found." });
  }
}

function getBalance(statement) {
  return statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);
}

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;

  const customerAlreadyExists = customers.some((user) => user.cpf === cpf);

  if (customerAlreadyExists) {
    return res.status(400).json({ error: "Customer already exists" });
  }

  const user = { cpf, name, id: uuid(), statement: [] };
  customers.push(user);

  return res.status(201).json(user);
});

app.get("/statement/:cpf", verifyIfAccountExists, (req, res) => {
  const { customer } = req;

  return res.status(200).json(customer);
});

app.post("/deposit", verifyIfAccountExists, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;

  const operation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(operation);

  return res.status(201).json(operation);
});

app.post("/withdraw", verifyIfAccountExists, (req, res) => {
  const { amount } = req.body;

  const { customer } = req;

  const balance = getBalance(customer.statement);

  console.log(balance, amount);

  if (balance < amount) {
    return res.status(400).json({ error: "Insufficient funds." });
  }

  const operation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(operation);

  return res.status(201).json(operation);
});

app.get("/statement/:date", verifyIfAccountExists, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormatted = new Date(date + "00:00");

  const statements = customer.statement.filter(
    (operation) =>
      operation.created_at.toDateString() ===
      new Date(dateFormatted).toDateString()
  );

  return res.json(statements);
});

app.listen(3333);
