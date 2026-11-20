/**
 * dsh-skin 的 Host 半边：什么都不做。
 *
 * 皮肤全部在浏览器里完成（client.js 用 ctx.theme.overrideTokens 叠一层
 * token 覆盖），Host 不需要服务、不读文件、不需要凭证。这里保持空壳，
 * 是为了让这个 bundle 的 loader 条目永远能激活；它一旦抛错，boot 的激活
 * 审计会把整棵插件树判死。
 */

export function apply() {}
