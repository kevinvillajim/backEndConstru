// src/infrastructure/database/entities/TemplateRatingEntity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
    Check,
    Index,
} from "typeorm";
import {UserEntity} from "./UserEntity";
import {CalculationTemplateEntity} from "./CalculationTemplateEntity";

@Entity("template_ratings")
@Unique("UQ_template_ratings_user_template", ["templateId", "userId"])
@Check("CHK_rating_range", "rating >= 1 AND rating <= 5")
@Index("IDX_template_ratings_template", ["templateId"])
@Index("IDX_template_ratings_user", ["userId"])
export class TemplateRatingEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({name: "template_id"})
    templateId: string;

    @Column({name: "user_id"})
    userId: string;

    @Column({type: "int"})
    rating: number;

    @Column({type: "text", nullable: true})
    comment: string;

    @ManyToOne(() => CalculationTemplateEntity, {onDelete: "CASCADE"})
    @JoinColumn({name: "template_id"})
    template: CalculationTemplateEntity;

    @ManyToOne(() => UserEntity, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    user: UserEntity;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at"})
    updatedAt: Date;
}
