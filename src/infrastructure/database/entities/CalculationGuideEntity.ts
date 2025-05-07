import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import {CalculationTemplateEntity} from "./CalculationTemplateEntity";
import {UserEntity} from "./UserEntity";

@Entity("calculation_guides")
export class CalculationGuideEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "calculation_template_id"})
	calculationTemplateId: string;

	@ManyToOne(() => CalculationTemplateEntity)
	@JoinColumn({name: "calculation_template_id"})
	calculationTemplate: CalculationTemplateEntity;

	@Column()
	title: string;

	@Column({type: "text"})
	content: string; // Contenido en formato markdown o HTML

	@Column({name: "created_by"})
	createdBy: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "created_by"})
	creator: UserEntity;

	@Column({name: "view_count", type: "int", default: 0})
	viewCount: number;

	@Column({name: "helpful_count", type: "int", default: 0})
	helpfulCount: number;

	@Column({type: "simple-array", nullable: true})
	images: string[]; // URLs de imágenes explicativas

	@Column({name: "video_url", nullable: true})
	videoUrl: string; // URL de video tutorial

	@Column({name: "is_published", default: true})
	isPublished: boolean;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
