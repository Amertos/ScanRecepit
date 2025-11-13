import React from 'react';
import { 
    FoodIcon, 
    GroceriesIcon, 
    ShoppingIcon, 
    TransportIcon, 
    HealthIcon, 
    EntertainmentIcon, 
    UtilitiesIcon, 
    HomeIcon, 
    OtherIcon 
} from './Icons';
import type { SpendingCategory } from '../types';

export const getCategoryIcon = (category: SpendingCategory): React.FC<React.SVGProps<SVGSVGElement>> => {
    switch (category) {
        case 'food_dining':
            return FoodIcon;
        case 'groceries':
            return GroceriesIcon;
        case 'shopping':
            return ShoppingIcon;
        case 'transportation':
            return TransportIcon;
        case 'health':
            return HealthIcon;
        case 'entertainment':
            return EntertainmentIcon;
        case 'utilities':
            return UtilitiesIcon;
        case 'home':
            return HomeIcon;
        default:
            return OtherIcon;
    }
};