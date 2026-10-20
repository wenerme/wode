/**
 * Provider CLI 参数校验错误。
 *
 * 宿主默认把 prepare() 的异常替换为泛化提示，防止回显原始输入或上游错误。
 * 本类型只用于由固定文案和选项名组成、不含用户输入值的消息，宿主可以原样显示。
 */
export class ServiceCliInputError extends Error {
	override name = 'ServiceCliInputError';
}
