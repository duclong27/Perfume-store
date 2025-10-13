import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";


class PaymentTransaction extends Model { }

PaymentTransaction.init(
    {
        paymentTxnId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            field: "payment_txn_id",
        },

        // FK -> orders.order_id (INT signed)
        orderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "order_id",
        },

        // Provider/txn
        provider: { type: DataTypes.ENUM("VNPAY"), allowNull: false, field: "provider" },
        txnRef: { type: DataTypes.STRING(64), allowNull: false, field: "txn_ref" },

        // Amounts (VND nguyên)
        amountVnd: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "amount_vnd" },
        amountVndReceived: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: "amount_vnd_received" },

        // Status & time
        status: {
            type: DataTypes.ENUM("pending", "paid", "failed", "cancelled"),
            allowNull: false,
            defaultValue: "pending",
            field: "status",
        },
        paidAt: { type: DataTypes.DATE, allowNull: true, field: "paid_at" },

        // VNPay observed fields
        vnpTransactionNo: { type: DataTypes.STRING(64), allowNull: true, field: "vnp_transaction_no" },
        vnpResponseCode: { type: DataTypes.STRING(4), allowNull: true, field: "vnp_response_code" },
        vnpBankCode: { type: DataTypes.STRING(20), allowNull: true, field: "vnp_bank_code" },
        vnpCardType: { type: DataTypes.STRING(20), allowNull: true, field: "vnp_card_type" },
        vnpPayDate: { type: DataTypes.DATE, allowNull: true, field: "vnp_pay_date" },

        // Logs & verification
        rawRequest: { type: DataTypes.JSON, allowNull: true, field: "raw_request" },
        rawResponse: { type: DataTypes.JSON, allowNull: true, field: "raw_response" },
        signatureOk: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "signature_ok" },
        lastIpnAt: { type: DataTypes.DATE, allowNull: true, field: "last_ipn_at" },
        ipnCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: "ipn_count" },
        failureReason: { type: DataTypes.STRING(255), allowNull: true, field: "failure_reason" },

      
    },
    {
        sequelize,
        modelName: "PaymentTransaction",
        tableName: "payment_transactions",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default PaymentTransaction;