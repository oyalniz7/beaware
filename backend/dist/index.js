"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const adapter_libsql_1 = require("@prisma/adapter-libsql");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const assetRoutes_1 = __importDefault(require("./routes/assetRoutes"));
const riskRoutes_1 = __importDefault(require("./routes/riskRoutes"));
const scanRoutes_1 = __importDefault(require("./routes/scanRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
app.use('/api/auth', authRoutes_1.default);
app.use('/api/assets', assetRoutes_1.default);
app.use('/api/risks', riskRoutes_1.default);
app.use('/api/scans', scanRoutes_1.default);
app.use('/api/admin', userRoutes_1.default);
// Initialize Prisma
const connectionString = process.env.DATABASE_URL || 'file:prisma/dev.db';
const adapter = new adapter_libsql_1.PrismaLibSql({
    url: connectionString,
});
exports.prisma = new client_1.PrismaClient({ adapter });
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
