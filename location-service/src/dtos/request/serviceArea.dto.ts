export interface CreateAreaDto {
  name: string;
  districtId: string; 
  center: {
    type: 'Point';
    coordinates: [number, number];
  };
  location: string;
  capacity: number;
  serviceDays: string[]; 
  postalCodes: string[];
}
