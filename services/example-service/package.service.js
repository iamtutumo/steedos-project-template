module.exports = {
  name: "example-service",

  mixins: [require('@steedos/service-object-mixin')],

  actions: {
    hello: {
      // 使用微服务方式定义 API 接口。
      // 访问地址： GET /service/api/example-service/hello/:name
      rest: { method: 'GET', path: '/hello/:name' },
      handler(ctx) {
        return {
          data: 'Welcome ' + ctx.params.name
        }
      }
    },
    me: {
      rest: { method: 'GET', path: '/me' },
      // 在微服务中获取当前登录的用户信息
      async handler(ctx) {
        return ctx.meta.user
      }
    },
    // 在微服务中调用graphql查询数据库
    graphqlQuerySpaceUsers: {
      rest: { method: 'GET', path: '/graphql' },
      async handler(ctx) {
        return await this.broker.call('api.graphql', {
          query: `
            query {
              space_users(filters: ["user", "=", "${ctx.meta.user.userId}"]) {
                name
                organization__expand {
                  name
                }
              }
            }
          `},
          // 如果查询 GraphQL 需要带上当前用户的权限，需要传入 user 属性。
          {
            user: ctx.meta.user
          }
        )
      },
    },
    // 在微服务中调用objectql查询数据库, 需要 mixins: [require('@steedos/service-object-mixin')],
    objectqlQuerySpaceUsers: {
      rest: { method: 'GET', path: '/objectql' },
      async handler(ctx) {
        return await this.getObject('space_users').find(
            {
              filters: ['user', '=', ctx.meta.user.userId]
            },
            ctx.meta.user
        )
      }
    },
    // 使用微服务定义触发器
    spaceUsersBeforeUpdate: {
      trigger: { listenTo: 'space_users', when: ['beforeUpdate']},
      async handler(ctx) {
        this.broker.logger.warn('spaceUsersBeforeUpdate', ctx);
        // throw new Error('Error from trigger.');
      }
    }
  }
}