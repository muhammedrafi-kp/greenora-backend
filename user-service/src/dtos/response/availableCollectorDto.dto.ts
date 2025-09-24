export class AvailableCollectorDto {
    public readonly _id: string;
    public readonly name: string;
    public readonly taskCount?: number;

    constructor(collector: { _id: string;  name: string; taskCount: number}) {
        this._id = collector._id.toString();
        this.name = collector.name;
        this.taskCount = collector.taskCount ?? 0;
    }

    public static from(collector: { _id: string;  name: string; taskCount: number}): AvailableCollectorDto {
        return new AvailableCollectorDto(collector);
    }

    public static fromList(collectors: { _id: string;  name: string; taskCount: number}[]): AvailableCollectorDto[] {
        return collectors.map(AvailableCollectorDto.from);
    }
}
