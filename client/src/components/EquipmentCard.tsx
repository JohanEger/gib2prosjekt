import type { Equipment } from '../types';

interface Props {
    equipment: Equipment;
    onClick?: (eq: Equipment) => void;
}

export const EquipmentCard: React.FC<Props> = ({ equipment, onClick }) => (
    <div onClick={() => onClick?.(equipment)} className="border p-4 rounded hover:bg-gray-100 cursor-pointer">
        <h3>{equipment.name}</h3>
        <p>{equipment.type}</p>
        <p>{equipment.current_pos && (
            <p>
                Lat: {equipment.current_pos.lat}, Lng: {equipment.current_pos.lng}
            </p>
        )}</p>
    </div>
);