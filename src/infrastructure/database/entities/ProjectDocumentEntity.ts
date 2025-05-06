import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import {ProjectEntity} from "./ProjectEntity";
import {UserEntity} from "./UserEntity";

export enum DocumentType {
	CONTRACT = "contract",
	BLUEPRINT = "blueprint",
	PERMIT = "permit",
	INVOICE = "invoice",
	REPORT = "report",
	SPECIFICATION = "specification",
	PHOTO = "photo",
	OTHER = "other",
}

@Entity("project_documents")
export class ProjectDocumentEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column({type: "text", nullable: true})
	description: string;

	@Column({
		type: "enum",
		enum: DocumentType,
		default: DocumentType.OTHER,
	})
	type: DocumentType;

	@Column({name: "file_path"})
	filePath: string;

	@Column({name: "file_size", type: "int", comment: "Tamaño en bytes"})
	fileSize: number;

	@Column({name: "file_type", comment: "MIME type"})
	fileType: string;

	@Column({name: "version", type: "int", default: 1})
	version: number;

	@Column({name: "project_id"})
	projectId: string;

	@ManyToOne(() => ProjectEntity, (project) => project.documents)
	@JoinColumn({name: "project_id"})
	project: ProjectEntity;

	@Column({name: "uploaded_by"})
	uploadedBy: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "uploaded_by"})
	uploader: UserEntity;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
