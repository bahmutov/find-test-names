import { TestTags } from './tags'

it('enum test 1', { tags: TestTags.smoke })

it('enum test 2', { tags: TestTags.regression })

it('enum test 3', { tags: TestTags.sanity })
