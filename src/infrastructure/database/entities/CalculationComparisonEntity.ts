// src/infrastructure/database/entities/CalculationComparisonEntity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from "typeorm";
import {UserEntity} from "./UserEntity";

@Entity("calculation_comparisons")
@Index("IDX_calculation_comparisons_user", ["userId"])
@Index("IDX_calculation_comparisons_saved", ["isSaved"])
export class CalculationComparisonEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({name: "user_id"})
    userId: string;

    @Column({length: 255})
    name: string;

    @Column({type: "text", nullable: true})
    description: string;

    @Column({type: "json", name: "calculation_ids"})
    calculationIds: string[];

    @Column({type: "json", nullable: true, name: "comparison_data"})
    comparisonData: any;

    @Column({name: "is_saved", default: false})
    isSaved: boolean;

    @ManyToOne(() => UserEntity, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    user: UserEntity;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at"})
    updatedAt: Date;
}
