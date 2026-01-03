
import jwt from 'jsonwebtoken';
import { User, Role } from '../model/index.js';

export async function authCustomerOnly(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;
        if (!token) {
            return res.status(401).json({ message: 'Missing token' });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload.sub || payload.id; 

        const user = await User.findByPk(userId, {
            attributes: ['userId', 'isEnable'], 
            include: [
                {
                    model: Role,
                    as: 'roles',
                    attributes: ['roleName'],
                    through: { attributes: [] },
                },
            ],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

       
        if (user.isEnable === false || user.isEnable === 0) {
            return res.status(403).json({ message: 'Account is disabled' });
        }

        const roles = (user.roles || []).map(r =>
            (r.roleName || '').toString().trim().toLowerCase()
        );

        const isCustomer = roles.includes('customer');
        const isStaffOrAdmin = roles.includes('staff') || roles.includes('admin');

    
        if (!isCustomer || isStaffOrAdmin) {
            return res.status(403).json({ message: 'Forbidden: customer only' });
        }

        req.user = { id: userId, roles };
        return next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}
