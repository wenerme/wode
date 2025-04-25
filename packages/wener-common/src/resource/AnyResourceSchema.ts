import { z } from 'zod';
import { rz, SexTypeSchema } from './schema';

export type AnyResource = z.infer<typeof AnyResourceSchema>;
export const AnyResourceSchema = z
	.object({
		id: rz.resourceId.readonly().describe('ID'),
		uid: z.guid().nullish().readonly().describe('唯一ID'),
		tid: rz.resourceId.nullish().readonly().describe('租户ID'),
		sid: z.coerce.number().nullish().readonly().describe('序号'),
		eid: z.string().nullish().readonly().describe('外部ID'),
		cid: z.string().nullish().readonly().describe('服务商ID'),
		rid: z.string().nullish().readonly().describe('服务商资源ID'),

		code: z.string().nullish().describe('编号'),

		fullName: rz.friendlyName.optional().describe('名称'),
		displayName: rz.friendlyName.nullish().describe('显示名'),
		loginName: rz.loginName.nullish().describe('登录名'),
		email: z.string().nullish().describe('邮箱'),
		emailVerifiedAt: rz.date.nullish().describe('邮箱验证时间'),
		phoneNumber: rz.phoneNumber.nullish().describe('电话号码'),
		phoneNumberVerifiedAt: rz.date.nullish().describe('电话号码验证时间'),

		jobNumber: z.string().nullish().describe('工号'),
		jobTitle: z.string().nullish().describe('职位'),
		birthDate: rz.date.nullish().describe('出生日期'),

		password: rz.password.nullish().describe('密码'),
		sex: SexTypeSchema.nullish().describe('性别'),

		contactName: rz.friendlyName.nullish().describe('联系人'),
		contactPhone: rz.phoneNumber.nullish().describe('联系电话'),
		contactEmail: z.string().nullish().describe('联系邮箱'),
		contactAddress: z.string().nullish().describe('联系地址'),
		alternativeName: rz.friendlyName.nullish().describe('备用联系人'),
		alternativeEmail: z.string().nullish().describe('备用联系邮箱'),
		alternativePhone: rz.phoneNumber.nullish().describe('备用联系电话'),
		alternativeAddress: z.string().nullish().describe('备用联系地址'),

		title: z.string().trim().nullish().describe('标题'),
		description: z.string().trim().nullish().describe('描述'),
		topic: z.string().nullish().describe('主题'),
		summary: z.string().nullish().describe('摘要'),

		avatarUrl: z.string().nullish().describe('头像'),
		photoUrl: z.string().nullish().describe('照片'),
		imageUrl: z.string().nullish().describe('图片'),
		bannerUrl: z.string().nullish().describe('横幅图片'),

		type: z.string().nullish().describe('类型'),
		data: z.record(z.string(), z.any()).nullish().describe('数据'),

		licenseNumber: z.string().nullish().describe('证件号码'),
		licenseStartDate: rz.date.nullish().describe('证件有效期开始日期'),
		licenseEndDate: rz.date.nullish().describe('证件有效期结束日期'),
		licenseAddress: z.string().nullish().describe('证件地址'),
		licenseFrontUrl: z.string().nullish().describe('证件正面照片'),
		licenseBackUrl: z.string().nullish().describe('证件背面照片'),

		address: z.string().nullish().describe('地址'),
		divisionCode: z.string().nullish().describe('行政区划代码'),
		province: z.string().nullish().describe('省'),
		city: z.string().nullish().describe('市'),

		startDate: rz.date.nullish().describe('开始日期'),
		endDate: rz.date.nullish().describe('结束日期'),
		startTime: rz.dateTime.nullish().describe('开始时间'),
		endTime: rz.dateTime.nullish().describe('结束时间'),

		userId: rz.resourceIdOf('User').nullish(),
		entityId: rz.resourceId.nullish().describe('关联的实体'),
		entityType: z.string().nullish().describe('关联的实体类型'),
		customerId: rz.resourceId.nullish().describe('客户'),
		customerType: z.string().nullish().describe('客户类型'),
		contactId: rz.resourceId.nullish().describe('联系人'),
		accountId: rz.resourceId.nullish().describe('账户'),

		ownerId: rz.resourceId.nullish(),
		ownerType: z.string().nullish().describe('负责人类型'),
		owningUserId: rz.resourceId.nullish().describe('负责人'),

		parentId: rz.resourceId.nullish().describe('父级'),

		metadata: z.record(z.string(), z.any()).nullish().describe('元数据'),
		tags: z.array(z.string()).nullish().describe('标记'),
		notes: z.string().nullish().describe('备注'),

		state: z.string().nullish().describe('系统状态'),
		status: z.string().nullish().describe('状态'),
		statusReason: z.string().nullish().describe('状态原因'),
		statusUpdatedAt: rz.dateTime.nullish().describe('状态更新时间'),
		statusUpdatedById: rz.resourceId.nullish().describe('状态更新人'),

		createdAt: rz.dateTime.nullish().readonly().describe('创建时间'),
		updatedAt: rz.dateTime.nullish().readonly().describe('更新时间'),
		deletedAt: rz.dateTime.nullish().readonly().describe('删除时间'),

		createdById: z.string().nullish().readonly().describe('创建人'),
		updatedById: z.string().nullish().readonly().describe('更新人'),
		deletedById: z.string().nullish().readonly().describe('删除人'),

		attributes: z.record(z.string(), z.any()).nullish().describe('自定义属性'),
		properties: z.record(z.string(), z.any()).nullish().describe('属性'),
		extensions: z.record(z.string(), z.any()).nullish().describe('扩展属性'),

		__typename: z.coerce.string().nullish().describe('类型'),
	})
	.meta({
		title: 'AnyResource',
		description: '任意资源',
	});
